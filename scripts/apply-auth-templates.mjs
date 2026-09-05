#!/usr/bin/env node
/**
 * Pushes docs/email-templates/*.html (and their subjects) into Supabase Auth
 * through the Management API, so nobody has to paste six templates by hand.
 *
 *   SUPABASE_ACCESS_TOKEN=sbp_... node scripts/apply-auth-templates.mjs [project-ref]
 *
 * The token is a personal access token from
 * https://supabase.com/dashboard/account/tokens — never commit it.
 * Only keys that the project's current auth config already exposes are sent,
 * so a rename on Supabase's side fails loudly instead of silently no-op'ing.
 */
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");
const token = process.env.SUPABASE_ACCESS_TOKEN;
const ref =
  process.argv[2] ||
  /project_id\s*=\s*"([^"]+)"/.exec(readFileSync(resolve(root, "supabase/config.toml"), "utf8"))?.[1];

if (!token) {
  console.error("Set SUPABASE_ACCESS_TOKEN (personal access token, sbp_...).");
  process.exit(1);
}
if (!ref) {
  console.error("Could not determine the project ref.");
  process.exit(1);
}

// docs/email-templates/<file> → Management API key stem
const MAP = {
  "confirm-signup": "confirmation",
  "invite-user": "invite",
  "magic-link": "magic_link",
  "change-email": "email_change",
  "reset-password": "recovery",
  reauthentication: "reauthentication",
};

const dir = resolve(root, "docs/email-templates");
const meta = JSON.parse(readFileSync(resolve(dir, "templates.json"), "utf8"));

const api = `https://api.supabase.com/v1/projects/${ref}/config/auth`;
const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

const current = await fetch(api, { headers });
if (!current.ok) {
  console.error(`GET auth config failed: ${current.status} ${await current.text()}`);
  process.exit(1);
}
const existing = await current.json();

const patch = {};
for (const [file, stem] of Object.entries(MAP)) {
  const subjectKey = `mailer_subjects_${stem}`;
  const bodyKey = `mailer_templates_${stem}_content`;
  if (!(subjectKey in existing) || !(bodyKey in existing)) {
    console.warn(`skip ${file}: ${subjectKey}/${bodyKey} not present in auth config`);
    continue;
  }
  patch[subjectKey] = meta[file].subject;
  patch[bodyKey] = readFileSync(resolve(dir, `${file}.html`), "utf8");
}

// Optional extras via env (leave unset to keep current values)
const opt = (key, value) => {
  if (value !== undefined && key in existing) patch[key] = value;
};
opt("site_url", process.env.AUTH_SITE_URL);
opt("uri_allow_list", process.env.AUTH_REDIRECT_URLS);
if (process.env.AUTH_AUTOCONFIRM) opt("mailer_autoconfirm", process.env.AUTH_AUTOCONFIRM === "true");
if (process.env.AUTH_EMAIL_RATE_LIMIT) opt("rate_limit_email_sent", Number(process.env.AUTH_EMAIL_RATE_LIMIT));
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  opt("external_google_enabled", true);
  opt("external_google_client_id", process.env.GOOGLE_CLIENT_ID);
  opt("external_google_secret", process.env.GOOGLE_CLIENT_SECRET);
}

const res = await fetch(api, { method: "PATCH", headers, body: JSON.stringify(patch) });
if (!res.ok) {
  console.error(`PATCH failed: ${res.status} ${await res.text()}`);
  process.exit(1);
}
console.log(`Applied ${Object.keys(patch).length} settings to project ${ref}:`);
for (const k of Object.keys(patch)) console.log("  •", k);
