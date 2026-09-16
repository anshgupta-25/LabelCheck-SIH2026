/** Persistence helpers for label inspections. */
import { supabase } from "@/integrations/supabase/client";
import type { FieldResult, Verdict } from "./compliance";
import type { ScanBarcode } from "./barcode-report";

export interface ScanRow {
  id: string;
  created_at: string;
  image_url: string | null;
  extracted_text: string;
  language: string;
  verdict: string;
  product_name: string | null;
  source: string;
  field_results: FieldResult[];
  /** auth.users id of the inspector who created it; null for legacy rows. */
  owner_id: string | null;
  /**
   * Barcode detection, lookup and cross-check. Null when no barcode was found
   * or the scan predates the feature. Informational: it never affects the
   * Rule 6 verdict.
   */
  barcode?: ScanBarcode | null;
}

const BUCKET = "label-images";

/** Uploads the captured photo to private storage and returns its object path. */
export async function uploadLabelImage(file: Blob, ext = "jpg"): Promise<string | null> {
  const path = `${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });
  if (error) {
    console.error("[LabelCheck] image upload failed", error);
    return null;
  }
  return path;
}

/** Storage is private — reads go through short-lived signed URLs. */
export async function signedImageUrl(path: string | null): Promise<string | null> {
  if (!path) return null;
  // Data URLs, absolute URLs and bundled demo assets are served as-is.
  if (path.startsWith("data:") || path.startsWith("http") || path.startsWith("/")) return path;
  const { data } = await supabase.storage.from(BUCKET).createSignedUrl(path, 60 * 60);
  return data?.signedUrl ?? null;
}

/**
 * PostgREST reports an unknown column as PGRST204. We treat that specific
 * failure as "this deployment has not run the barcode migration yet" and
 * retry without the column, so a label check never fails because of an
 * optional feature. Any other error is a real error and propagates.
 */
export function isMissingBarcodeColumn(error: { code?: string; message?: string }): boolean {
  return error.code === "PGRST204" || /barcode.*column|column .*barcode/i.test(error.message ?? "");
}

export async function createScan(input: {
  imagePath: string | null;
  extractedText: string;
  language: string;
  verdict: Verdict;
  productName: string | null;
  source: "upload" | "demo";
  fields: FieldResult[];
  barcode?: ScanBarcode | null;
}): Promise<string> {
  const base = {
    image_url: input.imagePath,
    extracted_text: input.extractedText,
    language: input.language,
    verdict: input.verdict,
    product_name: input.productName,
    source: input.source,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    field_results: input.fields as any,
  };

  const first = await supabase
    .from("scans")
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .insert({ ...base, barcode: (input.barcode ?? null) as any })
    .select("id")
    .single();

  if (!first.error) return first.data.id;

  if (isMissingBarcodeColumn(first.error)) {
    console.warn(
      "[LabelCheck] scans.barcode column is missing — run the barcode migration. Saving without it.",
    );
    const retry = await supabase.from("scans").insert(base).select("id").single();
    if (retry.error) throw new Error(retry.error.message);
    return retry.data.id;
  }

  throw new Error(first.error.message);
}

export async function getScan(id: string): Promise<ScanRow | null> {
  const { data, error } = await supabase.from("scans").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(error.message);
  return (data as unknown as ScanRow) ?? null;
}

/** The signed-in inspector's own scans, newest first. */
export async function listScans(ownerId: string): Promise<ScanRow[]> {
  const { data, error } = await supabase
    .from("scans")
    .select("*")
    .eq("owner_id", ownerId)
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as ScanRow[];
}

export async function updateScanFields(
  id: string,
  fields: FieldResult[],
  verdict: Verdict,
): Promise<void> {
  const { error } = await supabase
    .from("scans")
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .update({ field_results: fields as any, verdict })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteScan(id: string): Promise<void> {
  const { error } = await supabase.from("scans").delete().eq("id", id);
  if (error) throw new Error(error.message);
}
