/** Persistence helpers for label inspections. */
import { supabase } from "@/integrations/supabase/client";
import type { FieldResult, Verdict } from "./compliance";

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

export async function createScan(input: {
  imagePath: string | null;
  extractedText: string;
  language: string;
  verdict: Verdict;
  productName: string | null;
  source: "upload" | "demo";
  fields: FieldResult[];
}): Promise<string> {
  const { data, error } = await supabase
    .from("scans")
    .insert({
      image_url: input.imagePath,
      extracted_text: input.extractedText,
      language: input.language,
      verdict: input.verdict,
      product_name: input.productName,
      source: input.source,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      field_results: input.fields as any,
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);
  return data.id;
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
