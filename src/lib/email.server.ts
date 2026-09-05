/**
 * Transactional e-mail via Resend (https://resend.com), server-only.
 *
 * - `sendEmail` posts to Resend's HTTP API; no SDK needed.
 * - `renderEmail` is the one branded layout every message uses.
 * - `welcomeEmail` / `reportEmail` build subject + HTML + text bodies.
 *
 * When RESEND_API_KEY is unset, sending is skipped and reported, never thrown,
 * so the app keeps working in environments without e-mail configured.
 */

const RESEND_ENDPOINT = "https://api.resend.com/emails";
const DEFAULT_FROM = "LabelCheck <labelcheck@anshguptaa.in>";
const DEFAULT_APP_URL = "https://sih.anshguptaa.in";

/** Public origin used for links inside e-mails. */
export function appUrl(fallbackOrigin?: string): string {
  const configured = process.env["PUBLIC_APP_URL"];
  const candidate = configured || fallbackOrigin || DEFAULT_APP_URL;
  return candidate.replace(/\/+$/, "");
}

export interface SendResult {
  sent: boolean;
  id?: string;
  reason?: string;
}

export async function sendEmail(input: {
  to: string;
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
}): Promise<SendResult> {
  const apiKey = process.env["RESEND_API_KEY"];
  if (!apiKey) return { sent: false, reason: "RESEND_API_KEY is not configured" };
  const from = process.env["RESEND_FROM"] || DEFAULT_FROM;

  const res = await fetch(RESEND_ENDPOINT, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from,
      to: [input.to],
      subject: input.subject,
      html: input.html,
      text: input.text,
      ...(input.replyTo ? { reply_to: input.replyTo } : {}),
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    console.error(`[LabelCheck email] Resend ${res.status}: ${body}`);
    return { sent: false, reason: `Resend responded ${res.status}` };
  }
  const payload = (await res.json()) as { id?: string };
  return payload.id ? { sent: true, id: payload.id } : { sent: true };
}

/* ------------------------------------------------------------------ */
/* Layout                                                              */
/* ------------------------------------------------------------------ */

const C = {
  ink: "#1a1614",
  inkSoft: "#463f3a",
  paper: "#faf6f0",
  card: "#fffdfa",
  line: "#e1d8cd",
  muted: "#807670",
  rust: "#c1542b",
  green: "#1e7a4e",
  red: "#ba2d2d",
};

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export interface EmailLayout {
  /** Shown in inbox preview text. */
  preheader: string;
  /** Small rust eyebrow above the heading. */
  eyebrow: string;
  heading: string;
  /** HTML paragraphs / blocks (already escaped where needed). */
  bodyHtml: string;
  cta?: { label: string; url: string };
  /** Muted note under the button. */
  footnote?: string;
  appUrl: string;
}

export function renderEmail(l: EmailLayout): string {
  const logo = `${l.appUrl}/favicon.png`;
  const cta = l.cta
    ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:28px 0 8px">
        <tr><td style="border-radius:12px;background:${C.ink}">
          <a href="${esc(l.cta.url)}" style="display:inline-block;padding:14px 26px;font:600 15px/1 -apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#ffffff;text-decoration:none;border-radius:12px">${esc(l.cta.label)}</a>
        </td></tr></table>`
    : "";
  const footnote = l.footnote
    ? `<p style="margin:14px 0 0;font:400 12.5px/1.6 -apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:${C.muted}">${l.footnote}</p>`
    : "";

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light">
<title>${esc(l.heading)}</title>
</head>
<body style="margin:0;padding:0;background:${C.paper}">
<span style="display:none!important;visibility:hidden;opacity:0;color:transparent;height:0;width:0;overflow:hidden">${esc(l.preheader)}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.paper}">
<tr><td align="center" style="padding:32px 16px">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px">
    <!-- header -->
    <tr><td style="background:${C.ink};border-radius:20px 20px 0 0;padding:22px 28px">
      <table role="presentation" cellpadding="0" cellspacing="0"><tr>
        <td style="vertical-align:middle"><img src="${logo}" width="36" height="36" alt="" style="display:block;border-radius:10px"></td>
        <td style="vertical-align:middle;padding-left:12px">
          <div style="font:700 19px/1 Georgia,'Times New Roman',serif;color:#ffffff;letter-spacing:-0.2px">LabelCheck</div>
          <div style="margin-top:4px;font:400 11.5px/1.3 -apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#d6ccc2">Legal Metrology (Packaged Commodities) Rules, 2011</div>
        </td>
      </tr></table>
    </td></tr>
    <tr><td style="height:3px;background:${C.rust}"></td></tr>
    <!-- body -->
    <tr><td style="background:${C.card};border:1px solid ${C.line};border-top:0;border-radius:0 0 20px 20px;padding:32px 28px 28px">
      <div style="font:700 11px/1 -apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;letter-spacing:1.4px;text-transform:uppercase;color:${C.rust}">${esc(l.eyebrow)}</div>
      <h1 style="margin:12px 0 16px;font:400 28px/1.15 Georgia,'Times New Roman',serif;color:${C.ink};letter-spacing:-0.3px">${esc(l.heading)}</h1>
      <div style="font:400 15px/1.65 -apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:${C.inkSoft}">${l.bodyHtml}</div>
      ${cta}
      ${footnote}
    </td></tr>
    <!-- footer -->
    <tr><td style="padding:22px 12px 0;text-align:center;font:400 12px/1.6 -apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:${C.muted}">
      Sent by LabelCheck · Smart India Hackathon 2026 · SIH26034<br>
      <a href="${esc(l.appUrl)}" style="color:${C.muted};text-decoration:underline">${esc(l.appUrl.replace(/^https?:\/\//, ""))}</a>
    </td></tr>
  </table>
</td></tr>
</table>
</body>
</html>`;
}

/* ------------------------------------------------------------------ */
/* Messages                                                            */
/* ------------------------------------------------------------------ */

export function welcomeEmail(input: { name: string; appUrl: string }) {
  const first = input.name.trim().split(/\s+/)[0] || "there";
  const scanUrl = `${input.appUrl}/scan`;
  const subject = "Welcome to LabelCheck — your first label is a photo away";
  const html = renderEmail({
    appUrl: input.appUrl,
    preheader: "Scan one label or a batch of eight, get a cited Rule 6 verdict, export the PDF.",
    eyebrow: "Welcome aboard",
    heading: `Hi ${esc(first)}, you're set up.`,
    bodyHtml: `
      <p style="margin:0 0 14px">Your LabelCheck account is ready. Every inspection you run is logged under your name, so your history becomes an audit trail you can search, export and share.</p>
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:18px 0 6px;border:1px solid ${C.line};border-radius:14px;background:${C.paper}">
        ${[
          [
            "1",
            "Photograph the principal display panel",
            "one label, or drop up to eight for a batch check.",
          ],
          [
            "2",
            "Read the cited verdict",
            "each of the seven Rule 6(1) declarations with a confidence score.",
          ],
          ["3", "Export or share", "an officer-ready PDF with a QR code back to the live report."],
        ]
          .map(
            ([n, t, d]) => `<tr>
          <td style="padding:12px 0 12px 16px;width:36px;vertical-align:top"><span style="display:inline-block;width:24px;height:24px;border-radius:12px;background:${C.rust};color:#fff;font:700 12px/24px -apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;text-align:center">${n}</span></td>
          <td style="padding:12px 16px 12px 8px;font:400 14px/1.5 -apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:${C.inkSoft}"><strong style="color:${C.ink}">${t}</strong> — ${d}</td>
        </tr>`,
          )
          .join("")}
      </table>`,
    cta: { label: "Scan your first label", url: scanUrl },
    footnote: `Prefer to look around first? The <a href="${input.appUrl}/how-it-works" style="color:${C.rust}">How it works</a> page explains the pipeline and the legal basis.`,
  });
  const text = `Hi ${first},

Your LabelCheck account is ready. Every inspection you run is logged under your name.

1. Photograph the principal display panel — one label, or up to eight for a batch check.
2. Read the cited verdict for each of the seven Rule 6(1) declarations.
3. Export an officer-ready PDF with a QR code back to the live report.

Scan your first label: ${scanUrl}

— LabelCheck · SIH 2026 · SIH26034`;
  return { subject, html, text };
}

export function reportEmail(input: {
  appUrl: string;
  scanId: string;
  productName: string | null;
  verdict: string;
  missing: string[];
  senderName: string;
  note?: string | undefined;
}) {
  const compliant = input.verdict === "compliant";
  const url = `${input.appUrl}/report/${input.scanId}`;
  const product = input.productName || "Unnamed commodity";
  const tone = compliant ? C.green : C.red;
  const subject = `${compliant ? "COMPLIANT" : "NON-COMPLIANT"} · ${product} — LabelCheck report`;
  const missingHtml = input.missing.length
    ? `<p style="margin:16px 0 6px;font-weight:600;color:${C.ink}">Missing mandatory declarations</p>
       <ul style="margin:0;padding-left:18px">${input.missing.map((m) => `<li style="margin:4px 0">${esc(m)}</li>`).join("")}</ul>`
    : `<p style="margin:16px 0 0">All mandatory Rule 6(1) declarations were detected on this package.</p>`;
  const noteHtml = input.note
    ? `<blockquote style="margin:18px 0 0;padding:12px 16px;border-left:3px solid ${C.rust};background:${C.paper};border-radius:0 12px 12px 0;color:${C.inkSoft}">${esc(input.note)}</blockquote>`
    : "";
  const html = renderEmail({
    appUrl: input.appUrl,
    preheader: `${product}: ${compliant ? "compliant" : `${input.missing.length} mandatory declaration(s) missing`}.`,
    eyebrow: "Inspection report shared with you",
    heading: product,
    bodyHtml: `
      <p style="margin:0 0 12px"><strong style="color:${C.ink}">${esc(input.senderName)}</strong> shared a LabelCheck inspection report with you.</p>
      <p style="margin:0"><span style="display:inline-block;padding:6px 12px;border-radius:999px;background:${tone};color:#fff;font:700 12px/1 -apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;letter-spacing:0.6px">${compliant ? "COMPLIANT" : "NON-COMPLIANT"}</span></p>
      ${missingHtml}
      ${noteHtml}`,
    cta: { label: "Open the live report", url },
    footnote: `The report page has the per-field checklist, confidence scores, the extracted text and a downloadable PDF. Report ID ${esc(input.scanId)}.`,
  });
  const text = `${input.senderName} shared a LabelCheck inspection report with you.

Product: ${product}
Verdict: ${compliant ? "COMPLIANT" : "NON-COMPLIANT"}
${input.missing.length ? `Missing: ${input.missing.join(", ")}` : "All mandatory declarations detected."}
${input.note ? `\nNote: ${input.note}\n` : ""}
Open the live report: ${url}

— LabelCheck`;
  return { subject, html, text };
}
