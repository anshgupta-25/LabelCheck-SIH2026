/**
 * Client-side PDF export of a compliance report.
 *
 * Layout (A4 portrait):
 *   1. Ink header band with the LabelCheck mark, report id and date
 *   2. Verdict banner + three summary tiles
 *   3. Label photo · scan metadata · QR code to the live report
 *   4. Declarations table with status pills and confidence bars
 *   5. Violation cards (only when non-compliant)
 *   6. Appendix with the raw extracted text
 *
 * jsPDF's built-in fonts only cover Latin-1, so text is sanitised before
 * drawing (₹ → "Rs.", Devanagari dropped) and the appendix says so when
 * anything had to be removed.
 */
import { jsPDF } from "jspdf";
import QRCode from "qrcode";
import type { FieldResult, Verdict } from "./compliance";

/* ------------------------------------------------------------------ */
/* Palette (mirrors src/styles.css)                                    */
/* ------------------------------------------------------------------ */

type RGB = [number, number, number];
const INK: RGB = [26, 22, 20];
const INK_SOFT: RGB = [70, 63, 58];
const PAPER: RGB = [250, 246, 240];
const CARD: RGB = [255, 253, 250];
const CARD_ALT: RGB = [246, 241, 233];
const LINE: RGB = [225, 216, 205];
const MUTED: RGB = [128, 118, 110];
const RUST: RGB = [193, 84, 43];
const GREEN: RGB = [30, 122, 78];
const GREEN_SOFT: RGB = [228, 243, 234];
const RED: RGB = [186, 45, 45];
const RED_SOFT: RGB = [251, 232, 232];
const AMBER: RGB = [170, 108, 18];
const AMBER_SOFT: RGB = [252, 240, 219];
const WHITE: RGB = [255, 255, 255];

const M = 40; // page margin, pt

/* ------------------------------------------------------------------ */
/* Input                                                               */
/* ------------------------------------------------------------------ */

export interface ReportPdfInput {
  id: string;
  productName: string | null;
  verdict: Verdict;
  fields: FieldResult[];
  rawText: string;
  createdAt: string;
  source: string;
  language: string;
  imageUrl?: string | null;
  shareUrl: string;
  ocrQuality: number;
  /** Override for the header mark; defaults to the site favicon. */
  logoUrl?: string;
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

async function toDataUrl(url: string): Promise<{ data: string; format: "PNG" | "JPEG" } | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const blob = await res.blob();
    const data: string = await new Promise((resolve, reject) => {
      const fr = new FileReader();
      fr.onload = () => resolve(String(fr.result));
      fr.onerror = reject;
      fr.readAsDataURL(blob);
    });
    return { data, format: blob.type.includes("png") ? "PNG" : "JPEG" };
  } catch {
    return null;
  }
}

/** Map characters the standard PDF fonts cannot draw; report if any were dropped. */
function sanitise(input: string): { text: string; dropped: boolean } {
  const mapped = input
    .replace(/₹/g, "Rs. ")
    .replace(/[—–]/g, "-")
    .replace(/…/g, "...")
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/→/g, "->")
    .replace(/\u00a0/g, " ");
  // Keep newlines/tabs and printable Latin-1; drop everything else.
  const cleaned = mapped.replace(/[^\n\t\x20-\xff]/g, "");
  return { text: cleaned, dropped: cleaned.length !== mapped.length };
}

function statusOf(f: FieldResult): { label: string; tone: RGB; soft: RGB } {
  if (f.found) return { label: "FOUND", tone: GREEN, soft: GREEN_SOFT };
  if (!f.critical) return { label: "ADVISORY", tone: AMBER, soft: AMBER_SOFT };
  return { label: "MISSING", tone: RED, soft: RED_SOFT };
}

class Painter {
  readonly doc: jsPDF;
  readonly W: number;
  readonly H: number;
  y = 0;

  constructor(doc: jsPDF) {
    this.doc = doc;
    this.W = doc.internal.pageSize.getWidth();
    this.H = doc.internal.pageSize.getHeight();
  }

  get contentW() {
    return this.W - M * 2;
  }

  paper() {
    this.doc.setFillColor(...PAPER);
    this.doc.rect(0, 0, this.W, this.H, "F");
  }

  newPage() {
    this.doc.addPage();
    this.paper();
    this.y = M + 8;
  }

  /** Start a new page if `needed` points would run into the footer zone. */
  ensure(needed: number) {
    if (this.y + needed > this.H - 56) this.newPage();
  }

  font(style: "normal" | "bold" | "italic", size: number, color: RGB) {
    this.doc.setFont("helvetica", style);
    this.doc.setFontSize(size);
    this.doc.setTextColor(...color);
  }

  mono(size: number, color: RGB) {
    this.doc.setFont("courier", "normal");
    this.doc.setFontSize(size);
    this.doc.setTextColor(...color);
  }

  text(
    s: string,
    x: number,
    y: number,
    opts?: { align?: "left" | "center" | "right"; maxWidth?: number },
  ) {
    this.doc.text(sanitise(s).text, x, y, opts);
  }

  width(s: string) {
    return this.doc.getTextWidth(sanitise(s).text);
  }

  wrap(s: string, maxWidth: number): string[] {
    return this.doc.splitTextToSize(sanitise(s).text, maxWidth) as string[];
  }

  card(x: number, y: number, w: number, h: number, fill: RGB, stroke: RGB = LINE, r = 8) {
    this.doc.setFillColor(...fill);
    this.doc.setDrawColor(...stroke);
    this.doc.setLineWidth(0.6);
    this.doc.roundedRect(x, y, w, h, r, r, "FD");
  }

  pill(label: string, x: number, cy: number, tone: RGB, soft: RGB) {
    this.font("bold", 6.5, tone);
    const w = this.width(label) + 12;
    this.doc.setFillColor(...soft);
    this.doc.roundedRect(x, cy - 7, w, 14, 7, 7, "F");
    this.text(label, x + w / 2, cy + 2.3, { align: "center" });
    return w;
  }

  bar(x: number, y: number, w: number, h: number, ratio: number, tone: RGB) {
    this.doc.setFillColor(...LINE);
    this.doc.roundedRect(x, y, w, h, h / 2, h / 2, "F");
    const fill = Math.max(0, Math.min(1, ratio)) * w;
    if (fill > 0) {
      this.doc.setFillColor(...tone);
      this.doc.roundedRect(x, y, Math.max(fill, h), h, h / 2, h / 2, "F");
    }
  }

  hairline(x1: number, x2: number, y: number, color: RGB = LINE) {
    this.doc.setDrawColor(...color);
    this.doc.setLineWidth(0.5);
    this.doc.line(x1, y, x2, y);
  }
}

/* ------------------------------------------------------------------ */
/* Sections                                                            */
/* ------------------------------------------------------------------ */

function drawHeader(
  p: Painter,
  input: ReportPdfInput,
  logo: { data: string; format: "PNG" | "JPEG" } | null,
) {
  const { doc, W } = p;
  const H = 92;
  doc.setFillColor(...INK);
  doc.rect(0, 0, W, H, "F");
  // rust accent rule under the band
  doc.setFillColor(...RUST);
  doc.rect(0, H, W, 3, "F");

  // mark
  const size = 42;
  const lx = M;
  const ly = (H - size) / 2;
  if (logo) {
    try {
      doc.addImage(logo.data, logo.format, lx, ly, size, size, undefined, "FAST");
    } catch {
      drawFallbackMark(p, lx, ly, size);
    }
  } else {
    drawFallbackMark(p, lx, ly, size);
  }

  p.font("bold", 22, WHITE);
  p.text("LabelCheck", lx + size + 14, 46);
  p.font("normal", 8.5, [214, 204, 194]);
  p.text(
    "Legal Metrology (Packaged Commodities) Rules, 2011  ·  Rule 6 compliance report",
    lx + size + 14,
    62,
  );

  // right block
  const rx = W - M;
  p.font("bold", 6.5, RUST);
  doc.setCharSpace(1.2);
  p.text("INSPECTION REPORT", rx, 36, { align: "right" });
  doc.setCharSpace(0);
  p.font("bold", 12, WHITE);
  p.text(`#${input.id.slice(0, 8).toUpperCase()}`, rx, 53, { align: "right" });
  p.font("normal", 8, [214, 204, 194]);
  p.text(
    new Date(input.createdAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }),
    rx,
    66,
    {
      align: "right",
    },
  );

  p.y = H + 3 + 22;
}

function drawFallbackMark(p: Painter, x: number, y: number, size: number) {
  const { doc } = p;
  doc.setFillColor(...RUST);
  doc.roundedRect(x, y, size, size, 10, 10, "F");
  doc.setDrawColor(...WHITE);
  doc.setLineWidth(2.2);
  const i = size * 0.26;
  const l = size * 0.18;
  // scan-frame corners
  doc.line(x + i, y + i + l, x + i, y + i);
  doc.line(x + i, y + i, x + i + l, y + i);
  doc.line(x + size - i - l, y + i, x + size - i, y + i);
  doc.line(x + size - i, y + i, x + size - i, y + i + l);
  doc.line(x + i, y + size - i - l, x + i, y + size - i);
  doc.line(x + i, y + size - i, x + i + l, y + size - i);
  doc.line(x + size - i - l, y + size - i, x + size - i, y + size - i);
  doc.line(x + size - i, y + size - i, x + size - i, y + size - i - l);
  doc.line(x + i + 3, y + size / 2, x + size - i - 3, y + size / 2);
}

function drawVerdict(p: Painter, input: ReportPdfInput) {
  const { doc, W } = p;
  const compliant = input.verdict === "compliant";
  const tone = compliant ? GREEN : RED;
  const soft = compliant ? GREEN_SOFT : RED_SOFT;
  const critical = input.fields.filter((f) => f.critical);
  const missing = critical.filter((f) => !f.found);
  const found = input.fields.filter((f) => f.found).length;

  const h = 84;
  p.card(M, p.y, p.contentW, h, soft, tone, 10);
  doc.setFillColor(...tone);
  doc.roundedRect(M, p.y, 6, h, 3, 3, "F");
  doc.rect(M + 3, p.y, 3, h, "F");

  p.font("bold", 6.5, tone);
  doc.setCharSpace(1.2);
  p.text("VERDICT", M + 22, p.y + 20);
  doc.setCharSpace(0);
  p.font("bold", 24, tone);
  p.text(compliant ? "COMPLIANT" : "NON-COMPLIANT", M + 22, p.y + 46);
  p.font("normal", 9, INK_SOFT);
  const sub = compliant
    ? "All mandatory declarations under Rule 6(1) were detected on this package."
    : `${missing.length} of ${critical.length} mandatory declaration${missing.length === 1 ? "" : "s"} ${
        missing.length === 1 ? "is" : "are"
      } missing - the package does not meet Rule 6(1).`;
  p.text(sub, M + 22, p.y + 64, { maxWidth: p.contentW - 190 });

  // big fraction on the right
  p.font("bold", 30, tone);
  p.text(`${found}/${input.fields.length}`, W - M - 18, p.y + 48, { align: "right" });
  p.font("normal", 7, MUTED);
  p.text("declarations present", W - M - 18, p.y + 62, { align: "right" });

  p.y += h + 12;

  // summary tiles
  const gap = 10;
  const tw = (p.contentW - gap * 2) / 3;
  const th = 56;
  const tiles: { label: string; value: string; tone: RGB; ratio?: number }[] = [
    {
      label: "MANDATORY DECLARATIONS",
      value: `${critical.length - missing.length} of ${critical.length} present`,
      tone: INK,
    },
    {
      label: "VIOLATIONS",
      value: missing.length === 0 ? "None" : `${missing.length} missing`,
      tone: missing.length ? RED : GREEN,
    },
    {
      label: "EXTRACTION QUALITY",
      value: `${Math.round(input.ocrQuality * 100)}% legible`,
      tone: INK,
      ratio: input.ocrQuality,
    },
  ];
  tiles.forEach((t, i) => {
    const x = M + i * (tw + gap);
    p.card(x, p.y, tw, th, CARD);
    p.font("bold", 6.5, MUTED);
    doc.setCharSpace(0.8);
    p.text(t.label, x + 14, p.y + 18);
    doc.setCharSpace(0);
    p.font("bold", 14, t.tone);
    p.text(t.value, x + 14, p.y + 38);
    if (t.ratio !== undefined) {
      p.bar(x + 14, p.y + 45, tw - 28, 4, t.ratio, RUST);
    }
  });
  p.y += th + 16;
}

async function drawMediaRow(
  p: Painter,
  input: ReportPdfInput,
  img: { data: string; format: "PNG" | "JPEG" } | null,
) {
  const { doc, W } = p;
  const rowH = 128;
  const imgW = 168;

  // photo
  p.card(M, p.y, imgW, rowH, CARD);
  let drewImage = false;
  if (img) {
    try {
      const props = doc.getImageProperties(img.data);
      const boxW = imgW - 12;
      const boxH = rowH - 12;
      const scale = Math.min(boxW / props.width, boxH / props.height);
      const w = props.width * scale;
      const h = props.height * scale;
      doc.addImage(
        img.data,
        img.format,
        M + 6 + (boxW - w) / 2,
        p.y + 6 + (boxH - h) / 2,
        w,
        h,
        undefined,
        "FAST",
      );
      drewImage = true;
    } catch {
      /* fall through to placeholder */
    }
  }
  if (!drewImage) {
    p.font("italic", 8, MUTED);
    p.text("No photograph attached", M + imgW / 2, p.y + rowH / 2 + 3, { align: "center" });
  }

  // metadata
  const mx = M + imgW + 18;
  const meta: [string, string][] = [
    ["PRODUCT", input.productName || "Unnamed commodity"],
    ["SOURCE", input.source === "demo" ? "Demo label" : "Field scan"],
    ["LABEL LANGUAGE", input.language === "hin" ? "Hindi + English" : "English"],
    ["SCANNED", new Date(input.createdAt).toLocaleString("en-IN")],
    ["REPORT ID", input.id],
  ];
  const metaW = W - M - 118 - mx;
  let my = p.y + 14;
  for (const [k, v] of meta) {
    p.font("bold", 6.5, MUTED);
    doc.setCharSpace(0.8);
    p.text(k, mx, my);
    doc.setCharSpace(0);
    p.font("normal", 8.5, INK);
    const lines = p.wrap(v, metaW).slice(0, 2);
    p.text(lines[0] ?? "", mx, my + 11);
    if (lines[1]) p.text(lines[1], mx, my + 21);
    my += lines[1] ? 32 : 23;
  }

  // QR
  const qrSize = 100;
  const qx = W - M - qrSize;
  const qr = await QRCode.toDataURL(input.shareUrl || "https://labelcheck.app", {
    margin: 0,
    width: 400,
    errorCorrectionLevel: "M",
    color: { dark: "#1a1614", light: "#fffdfa" },
  });
  p.card(qx - 6, p.y, qrSize + 12, rowH, CARD);
  doc.addImage(qr, "PNG", qx, p.y + 6, qrSize, qrSize);
  p.font("normal", 6.5, MUTED);
  p.text("Scan for the live verdict", qx + qrSize / 2, p.y + rowH - 8, { align: "center" });

  p.y += rowH + 22;
}

function drawTable(p: Painter, input: ReportPdfInput) {
  const { doc, W } = p;
  // columns
  const cStatus = M;
  const cLabel = M + 74;
  const cValue = M + 230;
  const cRule = W - M - 104;
  const cConf = W - M - 50;
  const labelW = cValue - cLabel - 10;
  const valueW = cRule - cValue - 10;

  p.ensure(60);
  p.font("bold", 13, INK);
  p.text("Mandatory declarations - Rule 6(1)", M, p.y);
  p.font("normal", 8, MUTED);
  p.text(
    "Each declaration is checked for presence and a valid value; the rule cited is the clause it derives from.",
    M,
    p.y + 13,
  );
  p.y += 24;

  // header band
  doc.setFillColor(...CARD_ALT);
  doc.roundedRect(M, p.y, p.contentW, 20, 5, 5, "F");
  p.font("bold", 6.5, MUTED);
  doc.setCharSpace(0.8);
  p.text("STATUS", cStatus + 10, p.y + 13);
  p.text("DECLARATION", cLabel, p.y + 13);
  p.text("EXTRACTED VALUE", cValue, p.y + 13);
  p.text("RULE", cRule, p.y + 13);
  p.text("CONF.", cConf, p.y + 13);
  doc.setCharSpace(0);
  p.y += 24;

  input.fields.forEach((f, i) => {
    const st = statusOf(f);
    // measure with the fonts that will actually be used
    p.font("bold", 9, INK);
    const labelLines = p.wrap(f.label, labelW);
    p.font("normal", 8.5, INK);
    const valueLines = p
      .wrap(f.found && f.value ? f.value : "Not declared on this label", valueW)
      .slice(0, 4);
    const lines = Math.max(labelLines.length, valueLines.length);
    const rowH = Math.max(30, 14 + lines * 10.5);
    p.ensure(rowH + 4);

    if (i % 2 === 0) {
      doc.setFillColor(...CARD);
      doc.rect(M, p.y, p.contentW, rowH, "F");
    }
    const cy = p.y + rowH / 2;

    p.pill(st.label, cStatus + 8, cy, st.tone, st.soft);

    p.font("bold", 9, INK);
    p.text(labelLines.join("\n"), cLabel, p.y + 17);

    p.font("normal", 8.5, f.found ? INK : st.tone);
    if (!f.found) p.font("italic", 8.5, st.tone);
    p.text(valueLines.join("\n"), cValue, p.y + 17);

    p.font("normal", 8, MUTED);
    p.text(f.ruleRef.replace(/^Rule\s*/, ""), cRule, p.y + 17);

    const conf = f.found ? Math.round(f.confidence) : 0;
    p.bar(cConf, cy - 2, 26, 4, conf / 100, conf >= 80 ? GREEN : conf >= 50 ? AMBER : RED);
    p.font("bold", 7.5, INK_SOFT);
    p.text(`${conf}%`, cConf + 32, cy + 2.5);

    p.y += rowH;
    p.hairline(M, W - M, p.y);
  });
  p.y += 18;
}

function drawViolations(p: Painter, input: ReportPdfInput) {
  const { doc, W } = p;
  const missing = input.fields.filter((f) => f.critical && !f.found);
  const advisory = input.fields.filter((f) => !f.critical && !f.found);
  if (!missing.length && !advisory.length) return;

  p.ensure(60);
  p.font("bold", 13, INK);
  p.text(missing.length ? "Violations" : "Advisory notes", M, p.y);
  p.font("normal", 8, MUTED);
  p.text(
    missing.length
      ? "Each item below cites the sub-rule the package fails and what the law requires."
      : "Not required for a domestic pack, but noted for completeness.",
    M,
    p.y + 13,
  );
  p.y += 24;

  const draw = (f: FieldResult, tone: RGB, soft: RGB) => {
    p.font("normal", 8.5, INK_SOFT);
    const body = p.wrap(f.violation.replace(/^Rule [^:]+:\s*/, ""), p.contentW - 34);
    const h = 26 + body.length * 10.5;
    p.ensure(h + 8);
    p.card(M, p.y, p.contentW, h, soft, soft, 8);
    doc.setFillColor(...tone);
    doc.roundedRect(M, p.y, 5, h, 2.5, 2.5, "F");
    doc.rect(M + 2.5, p.y, 2.5, h, "F");
    p.font("bold", 9, tone);
    p.text(`${f.ruleRef}  ·  ${f.label}`, M + 18, p.y + 15);
    p.font("normal", 8.5, INK_SOFT);
    p.text(body.join("\n"), M + 18, p.y + 28);
    p.y += h + 8;
  };
  missing.forEach((f) => draw(f, RED, RED_SOFT));
  advisory.forEach((f) => draw(f, AMBER, AMBER_SOFT));
  p.y += 6;
  void W;
}

function drawAppendix(p: Painter, input: ReportPdfInput) {
  const { doc, W } = p;
  p.newPage();
  p.font("bold", 13, INK);
  p.text("Appendix - extracted label text", M, p.y + 6);
  p.font("normal", 8, MUTED);
  p.text(
    "Raw transcription produced by the vision model, exactly as read. This is what the rule engine evaluated.",
    M,
    p.y + 19,
  );
  p.y += 32;

  const raw = input.rawText.trim() || "No text was extracted from this image.";
  const { dropped } = sanitise(raw);
  p.mono(8.5, INK_SOFT);
  const lines = raw.split(/\r?\n/).flatMap((l) => (l.trim() ? p.wrap(l, p.contentW - 28) : [""]));

  let boxTop = p.y;
  const openBox = () => {
    boxTop = p.y;
  };
  const closeBox = (bottom: number) => {
    doc.setDrawColor(...LINE);
    doc.setLineWidth(0.6);
    doc.roundedRect(M, boxTop, p.contentW, bottom - boxTop, 8, 8, "S");
  };

  openBox();
  p.y += 14;
  for (const line of lines) {
    if (p.y + 11 > p.H - 56) {
      closeBox(p.y + 4);
      p.newPage();
      p.mono(8.5, INK_SOFT);
      openBox();
      p.y += 14;
    }
    p.text(line, M + 14, p.y);
    p.y += 11;
  }
  closeBox(p.y + 4);
  p.y += 16;

  if (dropped) {
    p.ensure(30);
    p.font("italic", 7.5, MUTED);
    p.text(
      "Some non-Latin characters (e.g. Devanagari) cannot be embedded in this PDF and were omitted above. The live report shows the full text.",
      M,
      p.y,
      { maxWidth: p.contentW },
    );
  }
  void W;
}

function drawFooters(p: Painter) {
  const { doc, W, H } = p;
  const pages = doc.getNumberOfPages();
  for (let n = 1; n <= pages; n++) {
    doc.setPage(n);
    p.hairline(M, W - M, H - 38);
    p.font("normal", 7, MUTED);
    p.text(
      "LabelCheck  ·  Automated Rule 6 screening. Findings are advisory and subject to verification by a Legal Metrology officer.",
      M,
      H - 26,
    );
    p.font("bold", 7.5, RUST);
    p.text(`${n} / ${pages}`, W - M, H - 26, { align: "right" });
  }
}

/* ------------------------------------------------------------------ */
/* Public API                                                          */
/* ------------------------------------------------------------------ */

/** Builds the document; callers decide whether to save or preview it. */
export async function buildReportPdf(input: ReportPdfInput): Promise<jsPDF> {
  const doc = new jsPDF({ unit: "pt", format: "a4", compress: true });
  const p = new Painter(doc);
  p.paper();

  const [logo, img] = await Promise.all([
    toDataUrl(input.logoUrl ?? "/favicon.png"),
    input.imageUrl ? toDataUrl(input.imageUrl) : Promise.resolve(null),
  ]);

  drawHeader(p, input, logo);
  drawVerdict(p, input);
  await drawMediaRow(p, input, img);
  drawTable(p, input);
  drawViolations(p, input);
  drawAppendix(p, input);
  drawFooters(p);

  doc.setProperties({
    title: `LabelCheck report ${input.id.slice(0, 8)}`,
    subject: "Legal Metrology (Packaged Commodities) Rules, 2011 - Rule 6 compliance report",
    author: "LabelCheck",
    creator: "LabelCheck",
  });
  return doc;
}

export async function downloadReportPdf(input: ReportPdfInput): Promise<void> {
  const doc = await buildReportPdf(input);
  // UUIDs are shortened to a readable stem; demo ids are already short, and
  // slicing them produced names like "LabelCheck-report-demo-non.pdf".
  const stem = /^[0-9a-f-]{36}$/i.test(input.id) ? input.id.slice(0, 8) : input.id;
  doc.save(`LabelCheck-report-${stem}.pdf`);
}
