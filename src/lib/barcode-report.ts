/**
 * The barcode payload as it is stored on a scan and rendered on a report.
 *
 * Kept in its own module so scans.ts, the report view and the PDF can all
 * refer to one shape without importing the browser-only decoder.
 */
import type { BarcodeResult } from "./barcode";
import type { LookupResult } from "./product-lookup";
import type { CrossCheck } from "./barcode-crosscheck";

export interface ScanBarcode {
  detected: boolean;
  value: string | null;
  format: string | null;
  /** Null unless a decoder that reports one is in use. */
  confidence: number | null;
  all?: { value: string; format: string }[];
  error?: string;
  lookup?: LookupResult;
  crossChecks?: CrossCheck[];
}

/** Narrows the detector output plus lookup into the stored shape. */
export function toScanBarcode(
  result: BarcodeResult,
  lookup?: LookupResult,
  crossChecks?: CrossCheck[],
): ScanBarcode {
  const out: ScanBarcode = {
    detected: result.detected,
    value: result.value,
    format: result.format,
    confidence: result.confidence,
  };
  if (result.all && result.all.length > 1) out.all = result.all;
  if (result.error) out.error = result.error;
  if (lookup) out.lookup = lookup;
  if (crossChecks?.length) out.crossChecks = crossChecks;
  return out;
}
