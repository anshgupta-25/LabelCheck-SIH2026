/**
 * Barcode detection and decoding.
 *
 * Runs in the browser, on the File the user already picked, so it costs no
 * server time and adds no latency: it is kicked off alongside the OCR request
 * and finishes well inside the 2.5-3s that extraction takes.
 *
 * ZXing-C++ via WebAssembly (zxing-wasm, MIT) handles rotation, inversion and
 * multiple symbols per image internally, so we do only the preprocessing it
 * does not: downscaling very large photos, and a second pass at higher effort
 * when the first finds nothing.
 *
 * IMPORTANT: a barcode is NOT one of the seven Rule 6(1) declarations. Nothing
 * here may influence the compliance verdict — it is an independent identity
 * signal shown alongside it. See docs/COMPLIANCE-RULES.md.
 */

export type BarcodeFormat =
  | "EAN-13"
  | "EAN-8"
  | "UPC-A"
  | "UPC-E"
  | "Code 128"
  | "Code 39"
  | "Code 93"
  | "ITF"
  | "Codabar"
  | "QR Code"
  | "Data Matrix"
  | "PDF417"
  | "Aztec"
  | string;

export interface BarcodeResult {
  detected: boolean;
  /** The decoded symbol text, e.g. "8901764082405". */
  value: string | null;
  format: BarcodeFormat | null;
  /**
   * ZXing does not report a decode confidence, and we will not invent one.
   * Kept in the shape so a future engine that does can populate it.
   */
  confidence: number | null;
  /** Every symbol found, when a pack carries more than one. */
  all?: { value: string; format: BarcodeFormat }[];
  /** Set when detection could not run at all, rather than simply finding nothing. */
  error?: string;
}

export const NO_BARCODE: BarcodeResult = {
  detected: false,
  value: null,
  format: null,
  confidence: null,
};

/**
 * Memory bound, not a quality choice.
 *
 * Resolution is everything for a 1-D barcode: an EAN-13 is 95 modules wide, so
 * a symbol occupying 2% of a 4032px phone photo is about 95px — barely one
 * pixel per module. Downscaling such a photo to 1600px made it undecodable,
 * which is exactly how a real bottle label failed. We now decode at native
 * resolution and cap only for memory on very large captures.
 */
const MAX_EDGE = 4096;

/** Below this the whole frame already carries enough detail to skip tiling. */
const TILE_MIN_EDGE = 1600;

export interface TileRect {
  sx: number;
  sy: number;
  sw: number;
  sh: number;
}

/**
 * Overlapping crop rectangles covering the frame.
 *
 * When a symbol is small inside a large photo, cropping to a region and
 * reading it at native resolution restores the pixels-per-module the decoder
 * needs. The overlap keeps a barcode that straddles a boundary wholly inside
 * at least one tile.
 */
export function tileRects(w: number, h: number, cols = 3, rows = 3, overlap = 0.2): TileRect[] {
  const tw = w / cols;
  const th = h / rows;
  const ox = tw * overlap;
  const oy = th * overlap;
  const out: TileRect[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const sx = Math.max(0, Math.round(c * tw - ox));
      const sy = Math.max(0, Math.round(r * th - oy));
      const sw = Math.min(w - sx, Math.round(tw + ox * 2));
      const sh = Math.min(h - sy, Math.round(th + oy * 2));
      if (sw > 16 && sh > 16) out.push({ sx, sy, sw, sh });
    }
  }
  return out;
}

/** Draws a region of the bitmap into a canvas and returns its pixels. */
function regionData(bitmap: ImageBitmap, rect: TileRect, scale = 1): ImageData | null {
  const w = Math.max(1, Math.round(rect.sw * scale));
  const h = Math.max(1, Math.round(rect.sh * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;
  ctx.drawImage(bitmap, rect.sx, rect.sy, rect.sw, rect.sh, 0, 0, w, h);
  return ctx.getImageData(0, 0, w, h);
}

/**
 * ZXing reports formats without separators ("EAN13", "UPCA", "QRCode"). Labels,
 * standards and the API contract all use the hyphenated forms, so normalise
 * once here rather than in every consumer.
 */
const FORMAT_NAMES: Record<string, BarcodeFormat> = {
  EAN13: "EAN-13",
  EAN8: "EAN-8",
  UPCA: "UPC-A",
  UPCE: "UPC-E",
  Code128: "Code 128",
  Code39: "Code 39",
  Code93: "Code 93",
  QRCode: "QR Code",
  MicroQRCode: "Micro QR Code",
  DataMatrix: "Data Matrix",
  DataBar: "GS1 DataBar",
  DataBarExpanded: "GS1 DataBar Expanded",
  ITF: "ITF",
  Codabar: "Codabar",
  PDF417: "PDF417",
  Aztec: "Aztec",
};

export function normaliseFormat(raw: string | undefined): BarcodeFormat {
  if (!raw) return "Unknown";
  return FORMAT_NAMES[raw] ?? raw;
}

/** Maps a ZXing result object onto our shape, tolerating field-name drift. */
function normalise(r: { text?: string; bytes?: unknown; format?: string }): {
  value: string;
  format: BarcodeFormat;
} | null {
  const value = (r.text ?? "").trim();
  if (!value) return null;
  return { value, format: normaliseFormat(r.format) };
}

/**
 * Detects and decodes any barcode in an image.
 *
 * Never throws: every failure mode — an unreadable file, a WASM load failure,
 * a damaged symbol, no symbol at all — resolves to `detected: false` so the
 * label check carries on exactly as it would without this module.
 */
export async function detectBarcode(file: Blob): Promise<BarcodeResult> {
  let bitmap: ImageBitmap | null = null;
  try {
    bitmap = await createImageBitmap(file).catch(() => null);
    if (!bitmap) {
      return { ...NO_BARCODE, error: "The image could not be read for barcode scanning." };
    }

    const { readBarcodes } = await import("zxing-wasm/reader");
    const read = async (img: ImageData, tryHarder: boolean) =>
      readBarcodes(img, { tryRotate: true, tryInvert: true, maxNumberOfSymbols: 4, tryHarder });

    const longest = Math.max(bitmap.width, bitmap.height);
    const scale = Math.min(1, MAX_EDGE / longest);
    const whole: TileRect = { sx: 0, sy: 0, sw: bitmap.width, sh: bitmap.height };

    // Pass 1: the whole frame at native resolution. Fast, and sufficient
    // whenever the barcode is a reasonable share of the photo.
    const full = regionData(bitmap, whole, scale);
    if (!full) {
      return { ...NO_BARCODE, error: "The image could not be read for barcode scanning." };
    }
    let results = await read(full, false);

    // Pass 2: the same frame, harder. Buys angled, blurry and low-contrast symbols.
    if (!results.length) results = await read(full, true);

    // Pass 3: a small symbol in a big photo survives neither the memory cap nor
    // a coarse scan of the whole frame, so crop tiles and read each at 1:1.
    if (!results.length && longest > TILE_MIN_EDGE) {
      for (const rect of tileRects(bitmap.width, bitmap.height)) {
        const tile = regionData(bitmap, rect);
        if (!tile) continue;
        results = await read(tile, true);
        if (results.length) break;
      }
    }

    const all = results
      .map((r) => normalise(r as { text?: string; format?: string }))
      .filter((r): r is { value: string; format: BarcodeFormat } => r !== null);

    if (!all.length) return { ...NO_BARCODE };

    // A pack can carry several symbols (a retail EAN plus an internal Code 128).
    // The retail product code is the useful one, so prefer a GTIN family.
    const GTIN = new Set<BarcodeFormat>(["EAN-13", "EAN-8", "UPC-A", "UPC-E"]);
    const primary = all.find((r) => GTIN.has(r.format)) ?? all[0]!;

    return {
      detected: true,
      value: primary.value,
      format: primary.format,
      confidence: null,
      all,
    };
  } catch (err) {
    console.error("[LabelCheck] barcode detection failed", err);
    return {
      ...NO_BARCODE,
      error: err instanceof Error ? err.message : "Barcode scanning failed.",
    };
  } finally {
    bitmap?.close();
  }
}

/* ------------------------------------------------------------------ */
/* GTIN helpers                                                        */
/* ------------------------------------------------------------------ */

/** True for an 8/12/13/14-digit GTIN whose check digit is valid. */
export function isValidGtin(value: string): boolean {
  const digits = value.trim();
  if (!/^\d{8}$|^\d{12,14}$/.test(digits)) return false;
  const nums = [...digits].map(Number);
  const check = nums.pop()!;
  // Weights alternate 3/1 from the right-hand end, whatever the length.
  const sum = nums.reverse().reduce((acc, n, i) => acc + n * (i % 2 === 0 ? 3 : 1), 0);
  return (10 - (sum % 10)) % 10 === check;
}

/**
 * The GS1 prefix tells you the member organisation that issued the number, not
 * where the product was made. 890 is GS1 India. We surface it as a hint only —
 * it is never evidence of country of origin under Rule 6(1)(g).
 */
export function gs1Origin(value: string): string | null {
  if (!/^\d{12,13}$/.test(value)) return null;
  const prefix = Number(value.slice(0, 3));
  if (prefix === 890) return "GS1 India";
  if (prefix >= 0 && prefix <= 139) return "GS1 US";
  if (prefix >= 500 && prefix <= 509) return "GS1 UK";
  if (prefix >= 690 && prefix <= 699) return "GS1 China";
  return null;
}
