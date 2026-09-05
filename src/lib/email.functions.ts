/**
 * Server functions that send e-mail on behalf of a signed-in user.
 *
 * The browser passes its Supabase access token; the handler verifies it with
 * Supabase Auth before doing anything, so nobody can trigger mail for a user
 * they are not. All sending goes through src/lib/email.server.ts (Resend),
 * loaded lazily so none of it reaches the client bundle.
 */
import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";
import type { FieldResult } from "./compliance";
import { demoScanRow } from "./demo-labels";

async function userFromToken(accessToken: string) {
  const url = process.env["SUPABASE_URL"] || process.env["VITE_SUPABASE_URL"];
  const key =
    process.env["SUPABASE_PUBLISHABLE_KEY"] || process.env["VITE_SUPABASE_PUBLISHABLE_KEY"];
  if (!url || !key) throw new Error("Supabase is not configured on the server.");
  const client = createClient<Database>(url, key, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  const { data, error } = await client.auth.getUser(accessToken);
  if (error || !data.user) throw new Error("You need to be signed in to do that.");
  return { client, user: data.user };
}

function nameOf(user: { email?: string | undefined; user_metadata?: Record<string, unknown> }) {
  const meta = (user.user_metadata ?? {}) as { full_name?: string; name?: string };
  return meta.full_name || meta.name || user.email?.split("@")[0] || "A LabelCheck inspector";
}

/* ------------------------------------------------------------------ */

const welcomeInput = z.object({
  accessToken: z.string().min(20),
  origin: z.string().url().optional(),
});

/** Sends the welcome mail once per account (idempotent via user metadata). */
export const sendWelcomeEmail = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => welcomeInput.parse(d))
  .handler(async ({ data }) => {
    const { user } = await userFromToken(data.accessToken);
    const meta = (user.user_metadata ?? {}) as { welcome_sent?: boolean };
    if (meta.welcome_sent) return { sent: false, reason: "already sent" };
    if (!user.email) return { sent: false, reason: "no e-mail on account" };

    const { sendEmail, welcomeEmail, appUrl } = await import("./email.server");
    const msg = welcomeEmail({ name: nameOf(user), appUrl: appUrl(data.origin) });
    return sendEmail({ to: user.email, ...msg });
  });

/* ------------------------------------------------------------------ */

const reportInput = z.object({
  accessToken: z.string().min(20),
  // A real report id is a uuid; demo reports use ids like "demo-compliant".
  scanId: z.string().min(3).max(64),
  to: z.string().email(),
  note: z.string().max(500).optional(),
  origin: z.string().url().optional(),
});

/** E-mails a link to one of the caller's own reports to a recipient. */
export const emailReport = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => reportInput.parse(d))
  .handler(async ({ data }) => {
    const { client, user } = await userFromToken(data.accessToken);

    // Demo reports live only in the bundle, so build the message from the
    // fixture. Sending still needs a signed-in caller — otherwise this would
    // be an open relay for anyone with the public key.
    const demo = demoScanRow(data.scanId);
    let scan: { id: string; product_name: string | null; verdict: string };
    let fields: FieldResult[];

    if (demo) {
      scan = { id: demo.id, product_name: demo.product_name, verdict: demo.verdict };
      fields = demo.field_results;
    } else {
      if (!/^[0-9a-f-]{36}$/i.test(data.scanId)) throw new Error("Report not found.");
      const { data: row, error } = await client
        .from("scans")
        .select("id, owner_id, product_name, verdict, field_results")
        .eq("id", data.scanId)
        .maybeSingle();
      if (error) throw new Error(error.message);
      if (!row) throw new Error("Report not found.");
      if (row.owner_id !== user.id)
        throw new Error("Only the inspector who created a report can e-mail it.");
      scan = { id: row.id, product_name: row.product_name, verdict: row.verdict };
      fields = (row.field_results as unknown as FieldResult[]) ?? [];
    }

    const missing = fields.filter((f) => f.critical && !f.found).map((f) => f.label);

    const { sendEmail, reportEmail, appUrl } = await import("./email.server");
    const msg = reportEmail({
      appUrl: appUrl(data.origin),
      scanId: scan.id,
      productName: scan.product_name,
      verdict: scan.verdict,
      missing,
      senderName: nameOf(user),
      note: data.note?.trim() || undefined,
    });
    const result = await sendEmail({
      to: data.to,
      ...msg,
      ...(user.email ? { replyTo: user.email } : {}),
    });
    if (!result.sent) throw new Error(result.reason ?? "E-mail could not be sent.");
    return result;
  });
