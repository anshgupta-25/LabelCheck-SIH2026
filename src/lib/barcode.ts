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

/** Longest edge we hand to the decoder; bigger costs time and finds no more. */
const MAX_EDGE = 1600;

/**
 * Draws the image into a canvas, downscaling if needed.
 * Returns null when the browser cannot decode the file at all.
 */
async function toImageData(file: Blob): Promise<ImageData | null> {
  const bitmap = await createImageBitmap(file).catch(() => null);
  if (!bitmap) return null;

  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  const w = Math.max(1, Math.round(bitmap.width * scale));
  const h = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) {
    bitmap.close();
    return null;
  }
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close();
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
  try {
    const image = await toImageData(file);
    if (!image)
      return { ...NO_BARCODE, error: "The image could not be read for barcode scanning." };

    const { readBarcodes } = await import("zxing-wasm/reader");

    // Pass 1: fast. Covers a clean, roughly upright barcode.
    let results = await readBarcodes(image, {
      tryHarder: false,
      tryRotate: true,
      tryInvert: true,
      maxNumberOfSymbols: 4,
    });

    // Pass 2: only when pass 1 found nothing. tryHarder is markedly slower, so
    // clear photos never pay for it — blurry or angled ones get the second look.
    if (!results.length) {
      results = await readBarcodes(image, {
        tryHarder: true,
        tryRotate: true,
        tryInvert: true,
        maxNumberOfSymbols: 4,
      });
    }

    const all = results
      .map((r) => normalise(r as { text?: string; format?: string }))
      .filter((r): r is { value: string; format: BarcodeFormat } => r !== null);

    if (!all.length) return { ...NO_BARCODE };

    // A pack can carry several symbols (retail EAN plus an internal Code 128).
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
