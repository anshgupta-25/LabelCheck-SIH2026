/** Client-side PDF export of a compliance report. */
import { jsPDF } from "jspdf";
import QRCode from "qrcode";
import type { FieldResult, Verdict } from "./compliance";

const INK: [number, number, number] = [26, 22, 20];
const MUTED: [number, number, number] = [122, 112, 105];
const RUST: [number, number, number] = [193, 84, 43];
const GREEN: [number, number, number] = [30, 122, 78];
const RED: [number, number, number] = [186, 45, 45];
const PAPER: [number, number, number] = [250, 246, 240];
const LINE: [number, number, number] = [225, 216, 205];

async function toDataUrl(url: string): Promise<{ data: string; format: string } | null> {
  try {
    const res = await fetch(url);
    const blob = await res.blob();
    const data: string = await new Promise((resolve, reject) => {
      const fr = new FileReader();
      fr.onload = () => resolve(String(fr.result));
      fr.onerror = reject;
      fr.readAsDataURL(blob);
    });
    const format = blob.type.includes("png") ? "PNG" : "JPEG";
    return { data, format };
  } catch {
    return null;
  }
}

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
}

export async function downloadReportPdf(input: ReportPdfInput): Promise<void> {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const M = 42;

  doc.setFillColor(...PAPER);
  doc.rect(0, 0, W, H, "F");

  // Header band
  doc.setFillColor(...INK);
  doc.rect(0, 0, W, 84, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text("LabelCheck", M, 40);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(230, 220, 210);
  doc.text("Legal Metrology (Packaged Commodities) Rules, 2011 — Rule 6 compliance report", M, 58);

  const compliant = input.verdict === "compliant";
  const tone = compliant ? GREEN : RED;

  let y = 112;

  // Product + verdict
  doc.setTextColor(...INK);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(17);
  doc.text(input.productName || "Unnamed commodity", M, y, { maxWidth: W - M * 2 - 150 });

  doc.setFillColor(...tone);
  doc.roundedRect(W - M - 150, y - 18, 150, 26, 6, 6, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.text(compliant ? "COMPLIANT" : "NON-COMPLIANT", W - M - 75, y - 0.5, { align: "center" });

  y += 20;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...MUTED);
  const stamp = new Date(input.createdAt).toLocaleString("en-IN");
  doc.text(
    `Report ID ${input.id}   ·   ${stamp}   ·   ${input.source === "demo" ? "Demo label" : "Field scan"}   ·   ${
      input.language === "hin" ? "Hindi" : "English"
    }   ·   Extraction quality ${Math.round(input.ocrQuality * 100)}%`,
    M,
    y,
    { maxWidth: W - M * 2 },
  );

  y += 18;

  // Image + QR row
  const rightX = W - M - 110;
  const img = input.imageUrl ? await toDataUrl(input.imageUrl) : null;
  if (img) {
    try {
      const props = doc.getImageProperties(img.data);
      const w = 150;
      const h = Math.min(120, (props.height / props.width) * w);
      doc.setDrawColor(...LINE);
      doc.roundedRect(M, y, w, h, 6, 6, "S");
      doc.addImage(img.data, img.format, M + 2, y + 2, w - 4, h - 4, undefined, "FAST");
    } catch {
      /* image is optional */
    }
  }

  const qr = await QRCode.toDataURL(input.shareUrl, {
    margin: 0,
    width: 320,
    color: { dark: "#1a1614", light: "#faf6f0" },
  });
  doc.addImage(qr, "PNG", rightX, y, 96, 96);
  doc.setFontSize(7.5);
  doc.setTextColor(...MUTED);
  doc.text("Scan for the live verdict", rightX + 48, y + 108, { align: "center" });

  const summaryX = M + 170;
  const found = input.fields.filter((f) => f.found).length;
  const missing = input.fields.filter((f) => f.critical && !f.found);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...INK);
  doc.text("Summary", summaryX, y + 14);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(...MUTED);
  doc.text(
    compliant
      ? `All ${input.fields.length} declarations detected. ${found}/${input.fields.length} present.`
      : `${missing.length} mandatory declaration${missing.length === 1 ? "" : "s"} missing. ${found}/${
          input.fields.length
        } present.`,
    summaryX,
    y + 32,
    { maxWidth: rightX - summaryX - 16 },
  );

  y += 130;

  // Checklist table
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(...INK);
  doc.text("Mandatory declarations — Rule 6(1)", M, y);
  y += 14;

  doc.setDrawColor(...LINE);
  doc.line(M, y, W - M, y);
  y += 6;

  doc.setFontSize(8);
  doc.setTextColor(...MUTED);
  doc.text("DECLARATION", M, y + 8);
  doc.text("EXTRACTED VALUE", M + 168, y + 8);
  doc.text("RULE", W - M - 118, y + 8);
  doc.text("CONF.", W - M - 40, y + 8);
  y += 16;
  doc.line(M, y, W - M, y);
  y += 4;

  for (const f of input.fields) {
    const valueLines = doc.splitTextToSize(f.value ?? "Not found", 200) as string[];
    const labelLines = doc.splitTextToSize(f.label, 148) as string[];
    const rowH = Math.max(26, 12 + Math.max(valueLines.length, labelLines.length) * 11);
    if (y + rowH > H - 90) {
      doc.addPage();
      doc.setFillColor(...PAPER);
      doc.rect(0, 0, W, H, "F");
      y = M;
    }

    doc.setFillColor(...(f.found ? GREEN : RED));
    doc.circle(M + 4, y + 11, 3.4, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...INK);
    doc.text(labelLines, M + 14, y + 14);

    doc.setFont("helvetica", "normal");
    doc.setTextColor(...(f.found ? INK : RED));
    doc.text(valueLines, M + 168, y + 14);

    doc.setTextColor(...MUTED);
    doc.setFontSize(8);
    doc.text(f.ruleRef.replace(/^Rule\s*/, ""), W - M - 118, y + 14);
    doc.text(`${Math.round(f.found ? f.confidence : 0)}%`, W - M - 40, y + 14);

    y += rowH;
    doc.setDrawColor(...LINE);
    doc.line(M, y - 4, W - M, y - 4);
  }

  y += 10;

  if (missing.length) {
    if (y > H - 140) {
      doc.addPage();
      doc.setFillColor(...PAPER);
      doc.rect(0, 0, W, H, "F");
      y = M;
    }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(...RED);
    doc.text("Violations", M, y);
    y += 14;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...INK);
    for (const f of missing) {
      const lines = doc.splitTextToSize(`${f.ruleRef} — ${f.violation}`, W - M * 2) as string[];
      if (y + lines.length * 11 > H - 70) {
        doc.addPage();
        doc.setFillColor(...PAPER);
        doc.rect(0, 0, W, H, "F");
        y = M;
      }
      doc.text(lines, M, y);
      y += lines.length * 11 + 6;
    }
  }

  // Raw text appendix
  doc.addPage();
  doc.setFillColor(...PAPER);
  doc.rect(0, 0, W, H, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(...INK);
  doc.text("Appendix — extracted label text", M, M + 8);
  doc.setFont("courier", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...MUTED);
  const raw = doc.splitTextToSize(
    input.rawText || "No text was extracted from this image.",
    W - M * 2,
  ) as string[];
  let ry = M + 32;
  for (const line of raw) {
    if (ry > H - 60) {
      doc.addPage();
      doc.setFillColor(...PAPER);
      doc.rect(0, 0, W, H, "F");
      ry = M;
    }
    doc.text(line, M, ry);
    ry += 11;
  }

  // Footers
  const pages = doc.getNumberOfPages();
  for (let p = 1; p <= pages; p++) {
    doc.setPage(p);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(...MUTED);
    doc.text(
      `LabelCheck · automated Rule 6 screening — findings are advisory and subject to officer verification`,
      M,
      H - 26,
    );
    doc.setTextColor(...RUST);
    doc.text(`${p} / ${pages}`, W - M, H - 26, { align: "right" });
  }

  doc.save(`LabelCheck-report-${input.id.slice(0, 8)}.pdf`);
}
