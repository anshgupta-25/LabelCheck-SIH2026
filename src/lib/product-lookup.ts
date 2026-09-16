/**
 * Product lookup by barcode.
 *
 * Deliberately a thin interface over a pluggable source. Today the only
 * configured source is Open Food Facts — free, open-licensed, no API key — but
 * its coverage of Indian packaged goods is partial, so "not found" is a normal
 * outcome and never evidence that a product is fake.
 *
 * To add a real source later (a GS1 India registry, an FSSAI dataset, a
 * departmental database), write another Source and put it ahead of
 * openFoodFacts in SOURCES. Nothing else changes.
 */

export interface ProductInfo {
  barcode: string;
  name: string | null;
  brand: string | null;
  quantity: string | null;
  manufacturer: string | null;
  country: string | null;
  /** Which database answered, shown in the UI so a claim can be traced. */
  source: string;
}

export type LookupStatus = "found" | "not_found" | "unavailable" | "unconfigured";

export interface LookupResult {
  status: LookupStatus;
  product: ProductInfo | null;
  /** Human-readable reason, shown verbatim when there is no product. */
  message: string;
}

export const LOOKUP_UNCONFIGURED: LookupResult = {
  status: "unconfigured",
  product: null,
  message: "Product information unavailable — no product database is configured.",
};

interface Source {
  name: string;
  enabled: () => boolean;
  fetch: (barcode: string, signal: AbortSignal) => Promise<ProductInfo | null>;
}

/* ------------------------------------------------------------------ */
/* Open Food Facts                                                     */
/* ------------------------------------------------------------------ */

const OFF_BASE = "https://world.openfoodfacts.org/api/v2/product";

const openFoodFacts: Source = {
  name: "Open Food Facts",
  // On by default; set VITE_PRODUCT_LOOKUP=off to disable entirely.
  enabled: () =>
    (import.meta.env["VITE_PRODUCT_LOOKUP"] as string | undefined)?.toLowerCase() !== "off",
  async fetch(barcode, signal) {
    const url = `${OFF_BASE}/${encodeURIComponent(barcode)}.json?fields=code,product_name,brands,quantity,manufacturing_places,countries`;
    const res = await fetch(url, { signal, headers: { Accept: "application/json" } });
    if (!res.ok) throw new Error(`Open Food Facts returned ${res.status}`);

    const body = (await res.json()) as {
      status?: number;
      product?: Record<string, string | undefined>;
    };
    if (body.status !== 1 || !body.product) return null;

    const p = body.product;
    const clean = (v: string | undefined) => {
      const t = (v ?? "").trim();
      return t.length ? t : null;
    };
    return {
      barcode,
      name: clean(p["product_name"]),
      brand: clean(p["brands"]),
      quantity: clean(p["quantity"]),
      manufacturer: clean(p["manufacturing_places"]),
      country: clean(p["countries"]),
      source: openFoodFacts.name,
    };
  },
};

const SOURCES: Source[] = [openFoodFacts];

/* ------------------------------------------------------------------ */

/** How long we will wait before giving up and letting the scan finish. */
const TIMEOUT_MS = 6000;

/**
 * Looks a barcode up in the first configured source that answers.
 *
 * Never throws and never blocks the label check: a timeout, an outage or a
 * network failure all resolve to `unavailable`, which the UI states plainly
 * rather than treating as a compliance finding.
 */
export async function lookupProductByBarcode(barcode: string): Promise<LookupResult> {
  const value = barcode.trim();
  if (!value) return LOOKUP_UNCONFIGURED;

  const active = SOURCES.filter((s) => s.enabled());
  if (!active.length) return LOOKUP_UNCONFIGURED;

  for (const source of active) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      const product = await source.fetch(value, controller.signal);
      if (product) return { status: "found", product, message: `Found in ${source.name}.` };
    } catch (err) {
      console.warn(`[LabelCheck] product lookup via ${source.name} failed`, err);
      return {
        status: "unavailable",
        product: null,
        message: `${source.name} could not be reached. Barcode detected, but product database information is unavailable.`,
      };
    } finally {
      clearTimeout(timer);
    }
  }

  return {
    status: "not_found",
    product: null,
    message:
      "Barcode detected, but this product is not listed in the configured database. That is not evidence of a problem with the pack.",
  };
}
