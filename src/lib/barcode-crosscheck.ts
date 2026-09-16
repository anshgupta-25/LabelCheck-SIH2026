/**
 * Cross-verification between the barcode's registered product and what the
 * OCR actually read off the pack.
 *
 * This answers a different question from Rule 6. Rule 6 asks "are the seven
 * declarations present and valid"; this asks "is the pack claiming to be the
 * product its barcode is registered to". A mismatch is a lead for an officer,
 * not a statutory violation, so nothing here touches the compliance verdict.
 */
import type { FieldResult } from "./compliance";
import type { ProductInfo } from "./product-lookup";

export type CheckStatus = "match" | "mismatch" | "unknown";

export interface CrossCheck {
  label: string;
  /** What the product database has on record. */
  expected: string | null;
  /** What we read off the pack. */
  observed: string | null;
  status: CheckStatus;
  note?: string;
}

/** Lower-cased, punctuation- and space-insensitive, for fuzzy comparison. */
function key(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/** Either string containing the other, on a word basis — "Kinley" in "Kinley Mineral Water". */
function looseMatch(a: string, b: string): boolean {
  const x = key(a);
  const y = key(b);
  if (!x || !y) return false;
  if (x === y || x.includes(y) || y.includes(x)) return true;
  // Otherwise: do they share a distinctive word?
  const words = new Set(x.split(" ").filter((w) => w.length > 3));
  return y.split(" ").some((w) => w.length > 3 && words.has(w));
}

/** "500 g", "1 ltr", "250ml" → a comparable { n, unit } pair. */
function parseQuantity(s: string): { n: number; unit: string } | null {
  const m = /(\d+(?:[.,]\d+)?)\s*(kg|g|gm|gms|mg|l|ltr|litre|liter|ml)\b/i.exec(s);
  if (!m) return null;
  let n = Number((m[1] ?? "").replace(",", "."));
  let unit = (m[2] ?? "").toLowerCase();
  // Normalise to the base unit so 1 ltr and 1000 ml compare equal.
  if (unit === "kg") {
    n *= 1000;
    unit = "g";
  } else if (unit === "gm" || unit === "gms") unit = "g";
  else if (unit === "mg") {
    n /= 1000;
    unit = "g";
  } else if (unit === "l" || unit === "ltr" || unit === "litre" || unit === "liter") {
    n *= 1000;
    unit = "ml";
  }
  return Number.isFinite(n) ? { n, unit } : null;
}

function compare(label: string, expected: string | null, observed: string | null): CrossCheck {
  if (!expected || !observed) {
    return {
      label,
      expected,
      observed,
      status: "unknown",
      note: !expected ? "Not held in the product database" : "Not detected on the pack",
    };
  }
  return {
    label,
    expected,
    observed,
    status: looseMatch(expected, observed) ? "match" : "mismatch",
  };
}

/**
 * Builds the cross-check rows for a report.
 *
 * `fullText` is the raw transcription: a brand is often printed prominently
 * but is not itself a Rule 6 declaration, so it will not appear in `fields`.
 */
export function crossCheckProduct(
  product: ProductInfo,
  fields: FieldResult[],
  fullText: string,
): CrossCheck[] {
  const field = (k: string) => fields.find((f) => f.key === k)?.value ?? null;

  const rows: CrossCheck[] = [];

  rows.push(compare("Product name", product.name, field("commodity_name")));

  // The brand rarely lands in a Rule 6 field, so look for it in the raw text.
  rows.push(
    product.brand
      ? {
          label: "Brand",
          expected: product.brand,
          observed: product.brand
            .split(",")
            .map((b) => b.trim())
            .find((b) => b && key(fullText).includes(key(b)))
            ? product.brand
            : null,
          status: product.brand
            .split(",")
            .map((b) => b.trim())
            .some((b) => b && key(fullText).includes(key(b)))
            ? "match"
            : "mismatch",
        }
      : {
          label: "Brand",
          expected: null,
          observed: null,
          status: "unknown",
          note: "Not held in the product database",
        },
  );

  // Pack size compares numerically where both sides parse, so "1 ltr" on the
  // pack matches "1000 ml" on record instead of reading as a mismatch.
  const packObserved = field("net_quantity");
  if (product.quantity && packObserved) {
    const a = parseQuantity(product.quantity);
    const b = parseQuantity(packObserved);
    rows.push({
      label: "Pack size",
      expected: product.quantity,
      observed: packObserved,
      status:
        a && b
          ? a.unit === b.unit && Math.abs(a.n - b.n) < 0.01
            ? "match"
            : "mismatch"
          : looseMatch(product.quantity, packObserved)
            ? "match"
            : "mismatch",
    });
  } else {
    rows.push(compare("Pack size", product.quantity, packObserved));
  }

  rows.push(compare("Manufacturer", product.manufacturer, field("manufacturer")));

  return rows;
}

export interface CrossCheckSummary {
  matches: number;
  mismatches: number;
  unknown: number;
}

export function summariseCrossChecks(rows: CrossCheck[]): CrossCheckSummary {
  return {
    matches: rows.filter((r) => r.status === "match").length,
    mismatches: rows.filter((r) => r.status === "mismatch").length,
    unknown: rows.filter((r) => r.status === "unknown").length,
  };
}
