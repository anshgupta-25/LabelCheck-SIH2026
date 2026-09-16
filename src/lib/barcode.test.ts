/**
 * Barcode tests.
 *
 * These drive the real ZXing-C++ WASM decoder against barcode images this
 * file generates itself, rather than mocking the decoder — a mocked decoder
 * would prove nothing about whether detection actually works.
 *
 * Images are built as raw ImageData so the suite runs in Node with no DOM and
 * no fixture files to keep in the repository.
 */
import { describe, expect, it } from "vitest";
import { readBarcodes } from "zxing-wasm/reader";
import { gs1Origin, isValidGtin, normaliseFormat, tileRects } from "./barcode";
import { crossCheckProduct, summariseCrossChecks } from "./barcode-crosscheck";
import { lookupProductByBarcode } from "./product-lookup";
import { isMissingBarcodeColumn } from "./scans";
import { RULES, type FieldResult } from "./compliance";

/** The sample from the brief. One case among several, never the only one. */
const SAMPLE = "8901764082405";

/* ------------------------------------------------------------------ */
/* Helpers: render a barcode to ImageData so we can decode it back      */
/* ------------------------------------------------------------------ */

interface Bitmap {
  data: Uint8ClampedArray;
  width: number;
  height: number;
}

/** Builds an ImageData-like object of a 1-D barcode from its module pattern. */
function syntheticEan13(digits: string, opts: { quiet?: number; scale?: number } = {}): Bitmap {
  const scale = opts.scale ?? 3;
  const quiet = opts.quiet ?? 12;

  const L = [
    "0001101",
    "0011001",
    "0010011",
    "0111101",
    "0100011",
    "0110001",
    "0101111",
    "0111011",
    "0110111",
    "0001011",
  ];
  const G = [
    "0100111",
    "0110011",
    "0011011",
    "0100001",
    "0011101",
    "0111001",
    "0000101",
    "0010001",
    "0001001",
    "0010111",
  ];
  const R = [
    "1110010",
    "1100110",
    "1101100",
    "1000010",
    "1011100",
    "1001110",
    "1010000",
    "1000100",
    "1001000",
    "1110100",
  ];
  const PARITY = [
    "LLLLLL",
    "LLGLGG",
    "LLGGLG",
    "LLGGGL",
    "LGLLGG",
    "LGGLLG",
    "LGGGLL",
    "LGLGLG",
    "LGLGGL",
    "LGGLGL",
  ];

  const d = [...digits].map(Number);
  const pattern = PARITY[d[0]!]!;
  let bits = "101";
  for (let i = 1; i <= 6; i++) {
    bits += pattern[i - 1] === "L" ? L[d[i]!]! : G[d[i]!]!;
  }
  bits += "01010";
  for (let i = 7; i <= 12; i++) bits += R[d[i]!]!;
  bits += "101";

  const width = (bits.length + quiet * 2) * scale;
  const height = 80;
  const data = new Uint8ClampedArray(width * height * 4).fill(255);

  for (let y = 0; y < height; y++) {
    for (let i = 0; i < bits.length; i++) {
      if (bits[i] !== "1") continue;
      for (let s = 0; s < scale; s++) {
        const x = (quiet + i) * scale + s;
        const o = (y * width + x) * 4;
        data[o] = 0;
        data[o + 1] = 0;
        data[o + 2] = 0;
        data[o + 3] = 255;
      }
    }
  }
  return { data, width, height };
}

/** Rotates an image 90° clockwise. */
function rotate90(img: Bitmap): Bitmap {
  const { data, width, height } = img;
  const out = new Uint8ClampedArray(data.length);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const src = (y * width + x) * 4;
      const nx = height - 1 - y;
      const ny = x;
      const dst = (ny * height + nx) * 4;
      out[dst] = data[src]!;
      out[dst + 1] = data[src + 1]!;
      out[dst + 2] = data[src + 2]!;
      out[dst + 3] = data[src + 3]!;
    }
  }
  return { data: out, width: height, height: width };
}

/** Pastes a barcode into a larger canvas with surrounding "label" noise. */
function onLabel(img: Bitmap): Bitmap {
  const width = img.width + 120;
  const height = img.height + 160;
  const data = new Uint8ClampedArray(width * height * 4).fill(245);
  for (let i = 3; i < data.length; i += 4) data[i] = 255;

  // scatter dark blocks to stand in for printed text around the symbol
  for (let b = 0; b < 40; b++) {
    const bx = (b * 37) % (width - 40);
    const by = (b * 13) % 60;
    for (let y = by; y < by + 6; y++)
      for (let x = bx; x < bx + 30; x++) {
        const o = (y * width + x) * 4;
        data[o] = 40;
        data[o + 1] = 40;
        data[o + 2] = 40;
      }
  }
  const ox = 60;
  const oy = 100;
  for (let y = 0; y < img.height; y++)
    for (let x = 0; x < img.width; x++) {
      const src = (y * img.width + x) * 4;
      const dst = ((y + oy) * width + (x + ox)) * 4;
      data[dst] = img.data[src]!;
      data[dst + 1] = img.data[src + 1]!;
      data[dst + 2] = img.data[src + 2]!;
      data[dst + 3] = 255;
    }
  return { data, width, height };
}

/**
 * Node has no ImageData constructor, but ZXing only reads data/width/height.
 * `colorSpace` is added to satisfy the DOM type the reader is declared with.
 */
const read = (img: Bitmap) =>
  readBarcodes({ ...img, colorSpace: "srgb" } as ImageData, {
    tryHarder: true,
    tryRotate: true,
    tryInvert: true,
    maxNumberOfSymbols: 4,
  });

/* ------------------------------------------------------------------ */

describe("barcode decoding", () => {
  it("1. decodes a clear EAN-13", async () => {
    const results = await read(syntheticEan13(SAMPLE));
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]!.text).toBe(SAMPLE);
    // ZXing reports "EAN13"; our normaliser is what produces the standard name.
    expect(normaliseFormat(results[0]!.format)).toBe("EAN-13");
  });

  it("2. decodes a rotated barcode", async () => {
    const results = await read(rotate90(syntheticEan13(SAMPLE)));
    expect(results.map((r) => r.text)).toContain(SAMPLE);
  });

  it("3. decodes a barcode inside a full label photo", async () => {
    const results = await read(onLabel(syntheticEan13(SAMPLE)));
    expect(results.map((r) => r.text)).toContain(SAMPLE);
  });

  it("4. finds nothing in an image without a barcode", async () => {
    const width = 400;
    const height = 300;
    const data = new Uint8ClampedArray(width * height * 4).fill(255);
    const results = await read({ data, width, height });
    expect(results).toHaveLength(0);
  });

  it("5. rejects a damaged, unreadable barcode rather than guessing", async () => {
    const img = syntheticEan13(SAMPLE);
    // Erase a vertical band through the middle of the symbol.
    for (let y = 0; y < img.height; y++)
      for (let x = Math.floor(img.width * 0.4); x < Math.floor(img.width * 0.6); x++) {
        const o = (y * img.width + x) * 4;
        img.data[o] = 255;
        img.data[o + 1] = 255;
        img.data[o + 2] = 255;
      }
    const results = await read(img);
    // Either nothing decodes, or whatever does is not the original number.
    expect(results.every((r) => r.text !== SAMPLE)).toBe(true);
  });

  it("6. reads more than one barcode from the same image", async () => {
    const a = syntheticEan13(SAMPLE);
    const b = syntheticEan13("8900000000005");
    const width = Math.max(a.width, b.width);
    const height = a.height + b.height + 40;
    const data = new Uint8ClampedArray(width * height * 4).fill(255);
    const paste = (img: typeof a, oy: number) => {
      for (let y = 0; y < img.height; y++)
        for (let x = 0; x < img.width; x++) {
          const src = (y * img.width + x) * 4;
          const dst = ((y + oy) * width + x) * 4;
          data[dst] = img.data[src]!;
          data[dst + 1] = img.data[src + 1]!;
          data[dst + 2] = img.data[src + 2]!;
          data[dst + 3] = 255;
        }
    };
    paste(a, 0);
    paste(b, a.height + 40);
    const results = await read({ data, width, height });
    const texts = results.map((r) => r.text);
    expect(texts).toContain(SAMPLE);
    expect(texts.length).toBeGreaterThanOrEqual(2);
  });

  it("7. reports an unsupported/unknown symbology as simply not found", async () => {
    // A dense random block is not a valid symbol in any supported format.
    const width = 300;
    const height = 300;
    const data = new Uint8ClampedArray(width * height * 4);
    for (let i = 0; i < data.length; i += 4) {
      const v = (i * 2654435761) % 255 > 127 ? 255 : 0;
      data[i] = v;
      data[i + 1] = v;
      data[i + 2] = v;
      data[i + 3] = 255;
    }
    const results = await read({ data, width, height });
    expect(results.every((r) => r.text !== SAMPLE)).toBe(true);
  });
});

describe("GTIN validation", () => {
  it("accepts a valid EAN-13 and rejects a corrupted one", () => {
    expect(isValidGtin(SAMPLE)).toBe(true);
    expect(isValidGtin("8900000000005")).toBe(true);
    expect(isValidGtin("8901764082404")).toBe(false);
    expect(isValidGtin("not-a-barcode")).toBe(false);
  });

  it("normalises ZXing format names to the standard hyphenated forms", () => {
    expect(normaliseFormat("EAN13")).toBe("EAN-13");
    expect(normaliseFormat("UPCA")).toBe("UPC-A");
    expect(normaliseFormat("QRCode")).toBe("QR Code");
    expect(normaliseFormat("Code128")).toBe("Code 128");
    expect(normaliseFormat(undefined)).toBe("Unknown");
    // an unmapped future format passes through rather than being dropped
    expect(normaliseFormat("SomeNewFormat")).toBe("SomeNewFormat");
  });

  it("maps the GS1 prefix without claiming country of origin", () => {
    expect(gs1Origin(SAMPLE)).toBe("GS1 India");
    expect(gs1Origin("123")).toBeNull();
  });
});

describe("product lookup", () => {
  it("8. returns a stated reason when no source is configured", async () => {
    const prev = import.meta.env["VITE_PRODUCT_LOOKUP"];
    import.meta.env["VITE_PRODUCT_LOOKUP"] = "off";
    const result = await lookupProductByBarcode(SAMPLE);
    expect(result.status).toBe("unconfigured");
    expect(result.product).toBeNull();
    expect(result.message).toMatch(/unavailable/i);
    import.meta.env["VITE_PRODUCT_LOOKUP"] = prev;
  });

  it("never throws on an empty barcode", async () => {
    await expect(lookupProductByBarcode("")).resolves.toBeTruthy();
  });
});

describe("cross-check", () => {
  const fields = (over: Partial<Record<string, string>>): FieldResult[] =>
    RULES.map((r) => ({
      key: r.key,
      label: r.label,
      ruleRef: r.ruleRef,
      requirement: r.requirement,
      violation: r.violation,
      critical: r.critical,
      found: !!over[r.key],
      value: over[r.key] ?? null,
      confidence: over[r.key] ? 90 : 0,
    }));

  it("matches brand and name, and flags a genuine pack-size mismatch", () => {
    const rows = crossCheckProduct(
      {
        barcode: SAMPLE,
        name: "Kinley Mineral Water",
        brand: "Kinley",
        quantity: "1 l",
        manufacturer: null,
        country: "India",
        source: "Open Food Facts",
      },
      fields({ commodity_name: "Mineral Water", net_quantity: "500 ml" }),
      "KINLEY Packaged Drinking Water 500 ml",
    );
    const by = (l: string) => rows.find((r) => r.label === l)!;
    expect(by("Brand").status).toBe("match");
    expect(by("Pack size").status).toBe("mismatch");
    expect(summariseCrossChecks(rows).mismatches).toBeGreaterThan(0);
  });

  it("treats 1 ltr and 1000 ml as the same pack size", () => {
    const rows = crossCheckProduct(
      {
        barcode: SAMPLE,
        name: "Water",
        brand: null,
        quantity: "1 l",
        manufacturer: null,
        country: null,
        source: "test",
      },
      fields({ net_quantity: "1000 ml" }),
      "water 1000 ml",
    );
    expect(rows.find((r) => r.label === "Pack size")!.status).toBe("match");
  });

  it("reports unknown, not mismatch, when the database holds nothing", () => {
    const rows = crossCheckProduct(
      {
        barcode: SAMPLE,
        name: null,
        brand: null,
        quantity: null,
        manufacturer: null,
        country: null,
        source: "test",
      },
      fields({ commodity_name: "Namkeen" }),
      "Namkeen",
    );
    expect(rows.every((r) => r.status !== "mismatch")).toBe(true);
  });
});

describe("missing barcode column", () => {
  it("recognises the exact PostgREST error so a scan still saves", () => {
    // Verbatim from Supabase when the migration has not been applied.
    expect(
      isMissingBarcodeColumn({
        code: "PGRST204",
        message: "Could not find the 'barcode' column of 'scans' in the schema cache",
      }),
    ).toBe(true);
    // Message alone, in case the code ever changes.
    expect(
      isMissingBarcodeColumn({
        message: "Could not find the 'barcode' column of 'scans' in the schema cache",
      }),
    ).toBe(true);
  });

  it("does not swallow unrelated database errors", () => {
    expect(isMissingBarcodeColumn({ code: "23505", message: "duplicate key value" })).toBe(false);
    expect(isMissingBarcodeColumn({ message: "new row violates row-level security policy" })).toBe(
      false,
    );
  });
});

describe("small barcode in a large photo", () => {
  /** Paints a barcode into a big frame, optionally rotated a quarter turn. */
  function inPhoto(W: number, H: number, bc: Bitmap, ox: number, oy: number, rot: boolean): Bitmap {
    const data = new Uint8ClampedArray(W * H * 4).fill(238);
    for (let i = 3; i < data.length; i += 4) data[i] = 255;
    for (let y = 0; y < bc.height; y++)
      for (let x = 0; x < bc.width; x++) {
        const v = bc.data[(y * bc.width + x) * 4]!;
        if (v > 128) continue;
        const px = rot ? ox + y : ox + x;
        const py = rot ? oy + x : oy + y;
        if (px < 0 || py < 0 || px >= W || py >= H) continue;
        const o = (py * W + px) * 4;
        data[o] = 0;
        data[o + 1] = 0;
        data[o + 2] = 0;
      }
    return { data, width: W, height: H };
  }

  /** Crops a region 1:1, the way regionData does in the browser. */
  function crop(img: Bitmap, r: { sx: number; sy: number; sw: number; sh: number }): Bitmap {
    const out = new Uint8ClampedArray(r.sw * r.sh * 4);
    for (let y = 0; y < r.sh; y++)
      for (let x = 0; x < r.sw; x++) {
        const src = ((y + r.sy) * img.width + (x + r.sx)) * 4;
        const dst = (y * r.sw + x) * 4;
        out[dst] = img.data[src]!;
        out[dst + 1] = img.data[src + 1]!;
        out[dst + 2] = img.data[src + 2]!;
        out[dst + 3] = 255;
      }
    return { data: out, width: r.sw, height: r.sh };
  }

  it("recovers a 90°-rotated barcode occupying ~2% of a 4032px photo", async () => {
    // The Kinley bottle case: the symbol is tiny relative to the frame and
    // turned on its side. Scanning the whole frame finds nothing; reading a
    // tile at native resolution does.
    const bc = syntheticEan13(SAMPLE, { scale: 1, quiet: 10 });
    const photo = inPhoto(4032, 3024, { ...bc, height: 230 }, 3100, 900, true);

    let found: string[] = [];
    for (const rect of tileRects(photo.width, photo.height)) {
      const hits = await read(crop(photo, rect));
      if (hits.length) {
        found = hits.map((h) => h.text);
        break;
      }
    }
    expect(found).toContain(SAMPLE);
  });

  it("tiles cover the whole frame and overlap at the seams", () => {
    const rects = tileRects(1000, 800);
    expect(rects.length).toBe(9);
    // every pixel of the frame falls inside at least one tile
    expect(Math.min(...rects.map((r) => r.sx))).toBe(0);
    expect(Math.min(...rects.map((r) => r.sy))).toBe(0);
    expect(Math.max(...rects.map((r) => r.sx + r.sw))).toBe(1000);
    expect(Math.max(...rects.map((r) => r.sy + r.sh))).toBe(800);
    // neighbouring tiles overlap rather than merely abutting
    const first = rects[0]!;
    const second = rects[1]!;
    expect(second.sx).toBeLessThan(first.sx + first.sw);
  });
});
