/**
 * Demo Mode fixtures.
 *
 * Two pre-captured label transcriptions with fully hard-coded compliance
 * results. Nothing here touches the vision model or the network, so the
 * scan → report flow is byte-for-byte reproducible in a live presentation.
 */

import { RULES, type FieldResult, type RuleKey, type Verdict } from "./compliance";
import type { ScanRow } from "./scans";
import type { ScanBarcode } from "./barcode-report";
import compliantImage from "@/assets/demo-label-compliant.jpg";
import nonCompliantImage from "@/assets/demo-label-non-compliant.jpg";

export interface DemoLabel {
  id: "compliant" | "non-compliant";
  title: string;
  subtitle: string;
  productName: string;
  /** Sample label photograph shown on the report */
  image: string;
  /** Simulated OCR transcription of the label photo */
  text: string;
  expected: string;
  /** Deterministic, hard-coded per-field outcome */
  fields: FieldResult[];
  verdict: Verdict;
  ocrQuality: number;
  /**
   * Fixed barcode result. Demo Mode never calls the decoder or the product
   * database, so the whole barcode flow is reproducible with no network —
   * including on a dead venue connection.
   */
  barcode?: ScanBarcode;
}

type Outcome = { value: string; confidence: number; matchedBy: string } | null;

/** Builds a full FieldResult list from fixed outcomes + statutory metadata. */
function buildFields(outcomes: Record<RuleKey, Outcome>): FieldResult[] {
  return RULES.map((rule) => {
    const o = outcomes[rule.key];
    return {
      key: rule.key,
      label: rule.label,
      ruleRef: rule.ruleRef,
      requirement: rule.requirement,
      violation: rule.violation,
      critical: rule.critical,
      found: !!o,
      value: o ? o.value : null,
      confidence: o ? o.confidence : 0,
      matchedBy: o ? o.matchedBy : undefined,
    };
  });
}

const COMPLIANT_TEXT = `CRISP & CO.
BUTTER BISCUITS
Common name: Biscuits

Manufactured by: Crisp Foods Pvt. Ltd.
Plot 42, MIDC Industrial Area, Pune Road,
Nashik, Maharashtra - 422007, India

Net Quantity: 200 g e
MFD: 03/2025
Best Before: 9 months from date of manufacture

M.R.P. Rs. 45.00/- (inclusive of all taxes)

Customer Care: 1800-123-4567
Email: care@crispfoods.co.in

Country of Origin: India
FSSAI Lic. No. 11522004000123`;

const NON_COMPLIANT_TEXT = `SHREE MASALA
NAMKEEN — PREMIUM BLEND

Packed by: Shree Trading Company
Old Market Road, Indore

Net Wt.

Store in a cool dry place.
Keep away from direct sunlight.

For best taste use within 6 months of opening.`;

export const DEMO_LABELS: DemoLabel[] = [
  {
    id: "compliant",
    title: "Fully compliant label",
    subtitle: "Crisp & Co. butter biscuits · all 7 declarations present",
    productName: "Crisp & Co. Butter Biscuits",
    image: compliantImage,
    expected: "Expected verdict: COMPLIANT",
    text: COMPLIANT_TEXT,
    verdict: "compliant",
    ocrQuality: 0.96,
    fields: buildFields({
      manufacturer: {
        value:
          "Manufactured by: Crisp Foods Pvt. Ltd., Plot 42, MIDC Industrial Area, Pune Road, Nashik, Maharashtra - 422007, India",
        confidence: 97,
        matchedBy: "declaration lead-in + PIN code",
      },
      commodity_name: {
        value: "Biscuits",
        confidence: 96,
        matchedBy: "explicit 'name' declaration",
      },
      net_quantity: {
        value: "Net Quantity: 200 g",
        confidence: 97,
        matchedBy: "'Net quantity' declaration with unit",
      },
      manufacture_date: {
        value: "MFD: 03/2025",
        confidence: 95,
        matchedBy: "labelled manufacture/packing date",
      },
      mrp: {
        value: "M.R.P. Rs. 45.00/-",
        confidence: 98,
        matchedBy: "MRP declaration + 'inclusive of all taxes'",
      },
      consumer_care: {
        value: "1800-123-4567 · care@crispfoods.co.in",
        confidence: 98,
        matchedBy: "phone + e-mail detected",
      },
      country_of_origin: {
        value: "Country of Origin: India",
        confidence: 98,
        matchedBy: "explicit country of origin declaration",
      },
    }),
  },
  {
    id: "non-compliant",
    title: "Non-compliant label",
    subtitle: "Shree Masala namkeen · 4 mandatory declarations missing",
    productName: "Shree Masala Namkeen",
    image: nonCompliantImage,
    expected: "Expected verdict: NON-COMPLIANT",
    text: NON_COMPLIANT_TEXT,
    verdict: "non_compliant",
    ocrQuality: 0.82,
    fields: buildFields({
      manufacturer: {
        value: "Packed by: Shree Trading Company, Old Market Road, Indore",
        confidence: 71,
        matchedBy: "declaration lead-in (no PIN code)",
      },
      commodity_name: {
        value: "Namkeen",
        confidence: 79,
        matchedBy: "generic commodity vocabulary",
      },
      // "Net Wt." with no positive quantity is not a declaration.
      net_quantity: null,
      manufacture_date: null,
      mrp: null,
      consumer_care: null,
      country_of_origin: null,
    }),
  },
];

export function getDemoLabel(id: string): DemoLabel | undefined {
  return DEMO_LABELS.find((d) => d.id === id);
}

/* ------------------------------------------------------------------ */
/* Offline report                                                      */
/* ------------------------------------------------------------------ */

/** Report ids of the form `demo-compliant` are served from here, never the DB. */
export const DEMO_REPORT_PREFIX = "demo-";

export function demoReportId(labelId: DemoLabel["id"]): string {
  return `${DEMO_REPORT_PREFIX}${labelId}`;
}

/**
 * A ScanRow-shaped view of a demo label, built entirely in the browser.
 *
 * Demo Mode must keep working with no network and no account — it is what
 * runs on stage — so nothing here touches Supabase. Returns null for any id
 * that is not a demo, letting the caller fall back to a real lookup.
 */

/**
 * Demo Mode barcode. A structurally valid EAN-13 — 890 is the GS1 India
 * prefix and the check digit is correct — but deliberately not a registered
 * product, because the demo packs are fictional and we will not invent
 * product-database entries for them. It exercises the honest, and most
 * common, real-world path: a barcode reads cleanly, and the database has
 * nothing on it.
 */
const DEMO_BARCODE: ScanBarcode = {
  detected: true,
  value: "8900000000005",
  format: "EAN-13",
  confidence: null,
  lookup: {
    status: "not_found",
    product: null,
    message:
      "Barcode detected, but this product is not listed in the configured database. That is not evidence of a problem with the pack.",
  },
};

export function demoScanRow(id: string): ScanRow | null {
  if (!id.startsWith(DEMO_REPORT_PREFIX)) return null;
  const label = getDemoLabel(id.slice(DEMO_REPORT_PREFIX.length));
  if (!label) return null;
  return {
    id,
    created_at: new Date().toISOString(),
    image_url: label.image,
    extracted_text: label.text,
    language: "eng",
    verdict: label.verdict,
    product_name: label.productName,
    source: "demo",
    field_results: label.fields,
    owner_id: null,
    // The compliant pack carries a barcode; the non-compliant one does not,
    // so a demo shows both the detected and the not-detected states.
    barcode: label.id === "compliant" ? DEMO_BARCODE : null,
  };
}
