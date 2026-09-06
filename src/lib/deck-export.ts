/**
 * PDF and PPTX exports of the pitch deck.
 *
 * Both render from DECK in deck-content.ts, so the file a judge downloads is
 * the deck they watched. Both libraries are imported dynamically: together they
 * are well over a megabyte, and nobody should pay for that unless they click
 * a download button.
 */
import { DECK, DECK_META, type Block, type DeckSlide } from "./deck-content";

/* 16:9, in inches — the shape PowerPoint and Keynote both expect. */
const W = 13.333;
const H = 7.5;

const INK = "1C1917";
const MUTED = "6B6259";
const ACCENT = "C65421";
const PAPER = "FAF7F2";
const CARD = "FFFFFF";
const LINE = "E5DED4";

/** jsPDF wants millimetres; keep one set of coordinates and convert. */
const mm = (inches: number) => inches * 25.4;

function hexToRgb(hex: string): [number, number, number] {
  return [
    parseInt(hex.slice(0, 2), 16),
    parseInt(hex.slice(2, 4), 16),
    parseInt(hex.slice(4, 6), 16),
  ];
}

/** Latin-1 is all the built-in jsPDF fonts can encode. */
function ascii(s: string): string {
  return s
    .replace(/₹/g, "Rs.")
    .replace(/[–—]/g, "-")
    .replace(/[’‘]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/·/g, "-")
    .replace(/×/g, "x")
    .replace(/[^\n\t\x20-\xff]/g, "");
}

/* ------------------------------------------------------------------ */
/* PDF                                                                 */
/* ------------------------------------------------------------------ */

export async function downloadDeckPdf(filename = "LabelCheck-SIH2026-Pitch.pdf") {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: [mm(W), mm(H)] });

  const PW = mm(W);
  const PH = mm(H);
  const M = mm(0.62);

  const setFill = (hex: string) => doc.setFillColor(...hexToRgb(hex));
  const setText = (hex: string) => doc.setTextColor(...hexToRgb(hex));
  const setDraw = (hex: string) => doc.setDrawColor(...hexToRgb(hex));

  DECK.forEach((slide, i) => {
    if (i > 0) doc.addPage([PW, PH], "landscape");

    setFill(PAPER);
    doc.rect(0, 0, PW, PH, "F");

    // accent rule down the left edge
    setFill(ACCENT);
    doc.rect(0, 0, mm(0.09), PH, "F");

    let y = M + mm(0.28);

    // kicker
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    setText(ACCENT);
    doc.text(ascii(`${slide.no ? slide.no + " · " : ""}${slide.kicker}`.toUpperCase()), M, y);

    // title
    y += mm(0.42);
    doc.setFont("times", "normal");
    doc.setFontSize(30);
    setText(INK);
    const titleLines = doc.splitTextToSize(ascii(slide.title), PW - M * 2) as string[];
    doc.text(titleLines, M, y);
    y += titleLines.length * mm(0.42) + mm(0.16);

    for (const block of slide.blocks) {
      if (y > PH - mm(0.9)) break;
      y = drawBlock(doc, block, M, y, PW - M * 2, PH);
    }

    // footer
    setDraw(LINE);
    doc.setLineWidth(0.3);
    doc.line(M, PH - mm(0.46), PW - M, PH - mm(0.46));
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    setText(MUTED);
    doc.text(
      ascii(`${DECK_META.title} · ${DECK_META.problemId} · Team ${DECK_META.team}`),
      M,
      PH - mm(0.24),
    );
    doc.text(`${i + 1} / ${DECK.length}`, PW - M, PH - mm(0.24), { align: "right" });
  });

  doc.save(filename);
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function drawBlock(doc: any, block: Block, x: number, y: number, w: number, ph: number): number {
  const setFill = (hex: string) => doc.setFillColor(...hexToRgb(hex));
  const setText = (hex: string) => doc.setTextColor(...hexToRgb(hex));
  const setDraw = (hex: string) => doc.setDrawColor(...hexToRgb(hex));

  switch (block.kind) {
    case "lead": {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(12);
      setText(MUTED);
      const lines = doc.splitTextToSize(ascii(block.text), w) as string[];
      doc.text(lines, x, y);
      return y + lines.length * mm(0.2) + mm(0.16);
    }

    case "note": {
      // splitTextToSize measures in the *current* font, so it has to be set
      // before wrapping or the text is measured smaller than it is drawn.
      doc.setFont("helvetica", "italic");
      doc.setFontSize(9.5);
      const lines = doc.splitTextToSize(ascii(block.text), w - mm(0.34)) as string[];
      const h = lines.length * mm(0.17) + mm(0.26);
      setFill("F3EDE4");
      doc.roundedRect(x, y - mm(0.12), w, h, 2, 2, "F");
      setFill(ACCENT);
      doc.rect(x, y - mm(0.12), mm(0.045), h, "F");
      setText(INK);
      doc.text(lines, x + mm(0.17), y + mm(0.04));
      return y + h + mm(0.14);
    }

    case "stats": {
      const gap = mm(0.14);
      const cw = (w - gap * (block.items.length - 1)) / block.items.length;
      const h = mm(0.92);
      block.items.forEach((s, i) => {
        const cx = x + i * (cw + gap);
        setFill(CARD);
        setDraw(LINE);
        doc.setLineWidth(0.3);
        doc.roundedRect(cx, y, cw, h, 2.5, 2.5, "FD");
        doc.setFont("times", "normal");
        doc.setFontSize(26);
        setText(ACCENT);
        doc.text(ascii(s.value), cx + mm(0.16), y + mm(0.42));
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8.5);
        setText(MUTED);
        doc.text(doc.splitTextToSize(ascii(s.label), cw - mm(0.32)), cx + mm(0.16), y + mm(0.62));
      });
      return y + h + mm(0.18);
    }

    case "bullets":
    case "steps": {
      const two = block.items.length > 3;
      const cols = two ? 2 : 1;
      const gap = mm(0.2);
      const cw = (w - gap * (cols - 1)) / cols;
      let maxY = y;
      block.items.forEach((it, i) => {
        const col = two ? i % 2 : 0;
        const row = two ? Math.floor(i / 2) : i;
        const cx = x + col * (cw + gap);
        const rowH = two ? mm(0.62) : mm(0.46);
        const cy = y + row * rowH;
        if (cy > ph - mm(0.9)) return;
        setFill(ACCENT);
        doc.circle(cx + mm(0.05), cy + mm(0.04), mm(0.045), "F");
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10.5);
        setText(INK);
        doc.text(ascii(it.title), cx + mm(0.18), cy + mm(0.07));
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        setText(MUTED);
        const lines = doc.splitTextToSize(ascii(it.body), cw - mm(0.18)) as string[];
        doc.text(lines.slice(0, 4), cx + mm(0.18), cy + mm(0.24));
        maxY = Math.max(maxY, cy + mm(0.24) + Math.min(lines.length, 4) * mm(0.15));
      });
      return maxY + mm(0.16);
    }

    case "table": {
      const cols = block.head.length;
      // first column narrow when it is an index or a short label
      const weights =
        cols === 3 ? [0.22, 0.3, 0.48] : cols === 2 ? [0.32, 0.68] : new Array(cols).fill(1 / cols);
      const widths = weights.map((f) => w * f);
      let ty = y;

      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      setText(ACCENT);
      let cx = x;
      block.head.forEach((h, i) => {
        doc.text(ascii(h.toUpperCase()), cx + mm(0.08), ty);
        cx += widths[i]!;
      });
      ty += mm(0.1);
      setDraw(LINE);
      doc.setLineWidth(0.3);
      doc.line(x, ty, x + w, ty);
      ty += mm(0.16);

      for (const row of block.rows) {
        doc.setFontSize(8.5);
        const cellLines = row.map((c, i) => {
          doc.setFont("helvetica", i === 0 ? "bold" : "normal");
          return doc.splitTextToSize(ascii(c), widths[i]! - mm(0.16));
        }) as string[][];
        const rowH = Math.max(...cellLines.map((l) => l.length)) * mm(0.15) + mm(0.12);
        if (ty + rowH > ph - mm(0.62)) break;
        cx = x;
        cellLines.forEach((lines, i) => {
          doc.setFont("helvetica", i === 0 ? "bold" : "normal");
          doc.setFontSize(8.5);
          setText(i === 0 ? INK : MUTED);
          doc.text(lines, cx + mm(0.08), ty);
          cx += widths[i]!;
        });
        ty += rowH;
        setDraw(LINE);
        doc.setLineWidth(0.15);
        doc.line(x, ty - mm(0.06), x + w, ty - mm(0.06));
      }
      return ty + mm(0.1);
    }
  }
}
/* eslint-enable @typescript-eslint/no-explicit-any */

/* ------------------------------------------------------------------ */
/* PPTX                                                                */
/* ------------------------------------------------------------------ */

export async function downloadDeckPptx(filename = "LabelCheck-SIH2026-Pitch.pptx") {
  const PptxGenJS = (await import("pptxgenjs")).default;
  const pptx = new PptxGenJS();

  pptx.defineLayout({ name: "LC16x9", width: W, height: H });
  pptx.layout = "LC16x9";
  pptx.author = `Team ${DECK_META.team}`;
  pptx.company = DECK_META.ministry;
  pptx.title = `${DECK_META.title} — ${DECK_META.event}`;
  pptx.subject = `Problem statement ${DECK_META.problemId}`;

  DECK.forEach((slide, i) => {
    const s = pptx.addSlide();
    s.background = { color: PAPER };
    s.addNotes(slide.notes);

    // accent rule + kicker + title
    s.addShape("rect", { x: 0, y: 0, w: 0.07, h: H, fill: { color: ACCENT } });
    s.addText(`${slide.no ? slide.no + "  ·  " : ""}${slide.kicker}`.toUpperCase(), {
      x: 0.62,
      y: 0.36,
      w: W - 1.24,
      h: 0.26,
      fontSize: 11,
      bold: true,
      color: ACCENT,
      charSpacing: 1.6,
    });
    s.addText(slide.title, {
      x: 0.62,
      y: 0.62,
      w: W - 1.24,
      h: 0.9,
      fontSize: 30,
      color: INK,
      fontFace: "Georgia",
      valign: "top",
    });

    let y = 1.62;
    for (const block of slide.blocks) y = addPptxBlock(s, block, y);

    // footer
    s.addShape("rect", { x: 0.62, y: H - 0.52, w: W - 1.24, h: 0.008, fill: { color: LINE } });
    s.addText(`${DECK_META.title}  ·  ${DECK_META.problemId}  ·  Team ${DECK_META.team}`, {
      x: 0.62,
      y: H - 0.46,
      w: 8,
      h: 0.28,
      fontSize: 9,
      color: MUTED,
    });
    s.addText(`${i + 1} / ${DECK.length}`, {
      x: W - 1.9,
      y: H - 0.46,
      w: 1.28,
      h: 0.28,
      fontSize: 9,
      color: MUTED,
      align: "right",
    });
  });

  await pptx.writeFile({ fileName: filename });
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function addPptxBlock(s: any, block: Block, y: number): number {
  const X = 0.62;
  const CW = W - 1.24;

  switch (block.kind) {
    case "lead":
      s.addText(block.text, {
        x: X,
        y,
        w: CW,
        h: 0.6,
        fontSize: 14,
        color: MUTED,
        valign: "top",
      });
      return y + 0.72;

    case "note":
      s.addShape("roundRect", {
        x: X,
        y,
        w: CW,
        h: 0.72,
        fill: { color: "F3EDE4" },
        rectRadius: 0.06,
        line: { color: LINE, width: 0.5 },
      });
      s.addShape("rect", { x: X, y, w: 0.05, h: 0.72, fill: { color: ACCENT } });
      s.addText(block.text, {
        x: X + 0.16,
        y: y + 0.04,
        w: CW - 0.3,
        h: 0.64,
        fontSize: 11,
        italic: true,
        color: INK,
        valign: "middle",
      });
      return y + 0.86;

    case "stats": {
      const n = block.items.length;
      const gap = 0.16;
      const cw = (CW - gap * (n - 1)) / n;
      block.items.forEach((st, i) => {
        const x = X + i * (cw + gap);
        s.addShape("roundRect", {
          x,
          y,
          w: cw,
          h: 1.16,
          fill: { color: CARD },
          rectRadius: 0.08,
          line: { color: LINE, width: 0.75 },
        });
        s.addText(st.value, {
          x: x + 0.16,
          y: y + 0.1,
          w: cw - 0.32,
          h: 0.5,
          fontSize: 30,
          color: ACCENT,
          fontFace: "Georgia",
        });
        s.addText(st.label, {
          x: x + 0.16,
          y: y + 0.6,
          w: cw - 0.32,
          h: 0.48,
          fontSize: 10,
          color: MUTED,
        });
      });
      return y + 1.34;
    }

    case "bullets":
    case "steps": {
      const two = block.items.length > 3;
      const cols = two ? 2 : 1;
      const gap = 0.24;
      const cw = (CW - gap * (cols - 1)) / cols;
      const rowH = two ? 0.92 : 0.62;
      block.items.forEach((it, i) => {
        const col = two ? i % 2 : 0;
        const row = two ? Math.floor(i / 2) : i;
        const x = X + col * (cw + gap);
        const ry = y + row * rowH;
        s.addShape("ellipse", {
          x,
          y: ry + 0.07,
          w: 0.1,
          h: 0.1,
          fill: { color: ACCENT },
        });
        s.addText(it.title, {
          x: x + 0.22,
          y: ry,
          w: cw - 0.22,
          h: 0.24,
          fontSize: 13,
          bold: true,
          color: INK,
        });
        s.addText(it.body, {
          x: x + 0.22,
          y: ry + 0.23,
          w: cw - 0.22,
          h: rowH - 0.26,
          fontSize: 10.5,
          color: MUTED,
        });
      });
      return y + Math.ceil(block.items.length / cols) * rowH + 0.18;
    }

    case "table": {
      const cols = block.head.length;
      const weights =
        cols === 3 ? [0.22, 0.3, 0.48] : cols === 2 ? [0.32, 0.68] : new Array(cols).fill(1 / cols);
      const rows = [
        block.head.map((h) => ({
          text: h.toUpperCase(),
          options: { bold: true, color: ACCENT, fontSize: 10 },
        })),
        ...block.rows.map((r) =>
          r.map((c, i) => ({
            text: c,
            options: { bold: i === 0, color: i === 0 ? INK : MUTED, fontSize: 10 },
          })),
        ),
      ];
      s.addTable(rows, {
        x: X,
        y,
        w: CW,
        colW: weights.map((f) => CW * f),
        border: { type: "solid", color: LINE, pt: 0.5 },
        fill: { color: CARD },
        margin: 0.06,
        valign: "top",
        autoPage: false,
      });
      return y + 0.4 + block.rows.length * 0.42;
    }
  }
}
/* eslint-enable @typescript-eslint/no-explicit-any */

export type { DeckSlide };
