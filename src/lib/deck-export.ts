/**
 * PDF and PPTX exports of the pitch deck.
 *
 * Both render from DECK in deck-content.ts, so the file a judge downloads is
 * the deck they watched. Both libraries are imported dynamically: together they
 * are well over a megabyte, and nobody should pay for that unless they click a
 * download button.
 *
 * Layout note: a slide is not a document. Every block is either a fixed height
 * or flexes, and the body area is distributed between them, so content fills
 * the slide instead of stacking at the top and leaving half the page empty.
 */
import { DECK, DECK_META, type Block, type DeckSlide } from "./deck-content";

/* 16:9, in inches — the shape PowerPoint and Keynote both expect. */
const W = 13.333;
const H = 7.5;

const INK = "1C1917";
const MUTED = "6B6259";
const ACCENT = "C65421";
const ACCENT_SOFT = "F7E7DC";
const PAPER = "FAF7F2";
const CARD = "FFFFFF";
const LINE = "E5DED4";
const SOFT = "F1EBE1";
const OK = "2E7D52";
const BAD = "B3261E";

/** jsPDF works in millimetres here; one set of numbers, converted at the edge. */
const mm = (inches: number) => inches * 25.4;

const PW = mm(W);
const PH = mm(H);
const M = 16;
const BODY_BOT = PH - 14;

/** Blocks whose cards look empty when stretched; height ceiling in mm. */
const CAP_MM: Partial<Record<Block["kind"], number>> = {
  pipeline: 62,
  timeline: 66,
  bars: 52,
  metrics: 30,
  compare: 78,
};

function rgb(hex: string): [number, number, number] {
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
/* Screenshots                                                         */
/* ------------------------------------------------------------------ */

interface Loaded {
  data: string;
  w: number;
  h: number;
}

/** Fetches every screenshot the deck references, once, before rendering. */
async function loadImages(): Promise<Record<string, Loaded>> {
  const srcs = new Set<string>();
  for (const s of DECK)
    for (const b of s.blocks) {
      if (b.kind === "image" || b.kind === "split") srcs.add(b.src);
      if (b.kind === "gallery") for (const g of b.items) srcs.add(g.src);
    }

  const out: Record<string, Loaded> = {};
  await Promise.all(
    [...srcs].map(async (src) => {
      try {
        const res = await fetch(src);
        if (!res.ok) return;
        const blob = await res.blob();
        const data = await new Promise<string>((resolve, reject) => {
          const fr = new FileReader();
          fr.onload = () => resolve(String(fr.result));
          fr.onerror = () => reject(new Error(`Could not read ${src}`));
          fr.readAsDataURL(blob);
        });
        const dims = await new Promise<{ w: number; h: number }>((resolve) => {
          const img = new Image();
          img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight });
          img.onerror = () => resolve({ w: 16, h: 9 });
          img.src = data;
        });
        out[src] = { data, w: dims.w, h: dims.h };
      } catch {
        /* a missing screenshot must not sink the whole export */
      }
    }),
  );
  return out;
}

/** Fits w×h inside a box, centred, preserving aspect ratio. */
function fit(iw: number, ih: number, bw: number, bh: number) {
  const scale = Math.min(bw / iw, bh / ih);
  const w = iw * scale;
  const h = ih * scale;
  return { w, h, dx: (bw - w) / 2, dy: (bh - h) / 2 };
}

/* ------------------------------------------------------------------ */
/* PDF                                                                 */
/* ------------------------------------------------------------------ */

export async function downloadDeckPdf(filename = "LabelCheck-SIH2026-Pitch.pdf") {
  const [{ jsPDF }, images] = await Promise.all([import("jspdf"), loadImages()]);
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: [PW, PH] });

  const fill = (hex: string) => doc.setFillColor(...rgb(hex));
  const ink = (hex: string) => doc.setTextColor(...rgb(hex));
  const draw = (hex: string) => doc.setDrawColor(...rgb(hex));
  const font = (style: "normal" | "bold" | "italic", size: number, family = "helvetica") => {
    doc.setFont(family, style);
    doc.setFontSize(size);
  };
  /** Always set the font before measuring: splitTextToSize uses the current one. */
  const wrap = (
    s: string,
    w: number,
    size: number,
    style: "normal" | "bold" | "italic" = "normal",
    family = "helvetica",
  ) => {
    font(style, size, family);
    return doc.splitTextToSize(ascii(s), w) as string[];
  };

  const pill = (label: string, x: number, y: number, h = 5.4) => {
    font("bold", 7);
    const w = doc.getTextWidth(ascii(label)) + 5;
    fill(ACCENT_SOFT);
    doc.roundedRect(x, y, w, h, 1.6, 1.6, "F");
    ink(ACCENT);
    doc.text(ascii(label), x + 2.5, y + h - 1.8);
    return w;
  };

  const card = (x: number, y: number, w: number, h: number, bg = CARD) => {
    fill(bg);
    draw(LINE);
    doc.setLineWidth(0.3);
    doc.roundedRect(x, y, w, h, 2.4, 2.4, "FD");
  };

  /** Clipped paragraph: draws as many lines as fit in `maxH`. */
  const para = (
    s: string,
    x: number,
    y: number,
    w: number,
    maxH: number,
    size: number,
    colour: string,
    lead = 3.7,
  ) => {
    const l = wrap(s, w, size);
    const room = Math.max(0, Math.floor(maxH / lead));
    font("normal", size);
    ink(colour);
    doc.text(l.slice(0, room), x, y);
    return Math.min(l.length, room) * lead;
  };

  function drawBlock(b: Block, x: number, y: number, w: number, h: number) {
    switch (b.kind) {
      case "lead": {
        font("normal", 12);
        ink(MUTED);
        doc.text(wrap(b.text, w, 12), x, y + 4.5);
        return;
      }

      case "note": {
        const l = wrap(b.text, w - 14, 9.5, "italic");
        fill(SOFT);
        doc.roundedRect(x, y, w, h, 2, 2, "F");
        fill(ACCENT);
        doc.rect(x, y, 1.8, h, "F");
        font("italic", 9.5);
        ink(INK);
        doc.text(l, x + 7, y + 6.5);
        return;
      }

      case "metrics": {
        const gap = 4;
        const cw = (w - gap * (b.items.length - 1)) / b.items.length;
        b.items.forEach((s, n) => {
          const cx = x + n * (cw + gap);
          card(cx, y, cw, h);
          fill(ACCENT);
          doc.rect(cx, y, cw, 1.5, "F");
          font("normal", 23, "times");
          ink(ACCENT);
          doc.text(ascii(s.value), cx + 5, y + 14.5);
          para(s.label, cx + 5, y + 20, cw - 10, h - 21, 8, MUTED, 3.4);
        });
        return;
      }

      case "cards": {
        const cols = b.cols;
        const rows = Math.ceil(b.items.length / cols);
        const gap = 4;
        const cw = (w - gap * (cols - 1)) / cols;
        const ch = (h - gap * (rows - 1)) / rows;
        b.items.forEach((it, n) => {
          const cx = x + (n % cols) * (cw + gap);
          const cy = y + Math.floor(n / cols) * (ch + gap);
          card(cx, cy, cw, ch);
          let ty = cy + 7;
          if (it.badge) {
            pill(it.badge, cx + 5, cy + 4.5);
            ty = cy + 15;
          }
          const tl = wrap(it.title, cw - 10, 11, "bold").slice(0, 2);
          font("bold", 11);
          ink(INK);
          doc.text(tl, cx + 5, ty);
          ty += tl.length * 4.4 + 2;
          para(it.body, cx + 5, ty, cw - 10, cy + ch - ty - 3, 8.5, MUTED);
        });
        return;
      }

      case "pipeline": {
        const n = b.items.length;
        const arrow = 6;
        const cw = (w - arrow * (n - 1)) / n;
        b.items.forEach((it, k) => {
          const cx = x + k * (cw + arrow);
          card(cx, y, cw, h);
          fill(ACCENT);
          doc.circle(cx + 8.5, y + 9.5, 4.6, "F");
          font("bold", 9);
          ink("FFFFFF");
          doc.text(String(k + 1), cx + 8.5, y + 11.2, { align: "center" });
          const tl = wrap(it.title, cw - 10, 10.5, "bold").slice(0, 2);
          font("bold", 10.5);
          ink(INK);
          doc.text(tl, cx + 5, y + 21);
          const bodyTop = y + 21 + tl.length * 4.4 + 2;
          para(it.body, cx + 5, bodyTop, cw - 10, y + h - bodyTop - (it.out ? 12 : 4), 8, MUTED);
          if (it.out) {
            fill(ACCENT_SOFT);
            doc.roundedRect(cx + 5, y + h - 9.5, cw - 10, 6.4, 1.4, 1.4, "F");
            font("bold", 7);
            ink(ACCENT);
            doc.text(ascii(it.out), cx + 7.5, y + h - 5);
          }
          if (k < n - 1) {
            draw(ACCENT);
            doc.setLineWidth(0.8);
            const ax = cx + cw + 1;
            const my = y + h / 2;
            doc.line(ax, my, ax + arrow - 2, my);
            doc.line(ax + arrow - 4, my - 1.7, ax + arrow - 2, my);
            doc.line(ax + arrow - 4, my + 1.7, ax + arrow - 2, my);
          }
        });
        return;
      }

      case "table": {
        const cols = b.head.length;
        const weights =
          cols === 3 ? [0.2, 0.28, 0.52] : cols === 2 ? [0.3, 0.7] : new Array(cols).fill(1 / cols);
        const widths = weights.map((f) => w * f);
        fill(ACCENT_SOFT);
        doc.roundedRect(x, y, w, 8.4, 1.6, 1.6, "F");
        font("bold", 8);
        ink(ACCENT);
        let cx = x;
        b.head.forEach((hd, n) => {
          doc.text(ascii(hd.toUpperCase()), cx + 3.5, y + 5.6);
          cx += widths[n]!;
        });
        let ty = y + 8.4;
        const rowH = (h - 8.4) / b.rows.length;
        b.rows.forEach((row, r) => {
          if (r % 2 === 0) {
            fill(CARD);
            doc.rect(x, ty, w, rowH, "F");
          }
          cx = x;
          row.forEach((c, n) => {
            const style = n === 0 ? "bold" : "normal";
            const l = wrap(c, widths[n]! - 7, 8, style);
            font(style, 8);
            ink(n === 0 ? INK : MUTED);
            doc.text(l.slice(0, Math.max(1, Math.floor((rowH - 3) / 3.5))), cx + 3.5, ty + 5.2);
            cx += widths[n]!;
          });
          ty += rowH;
          draw(LINE);
          doc.setLineWidth(0.2);
          doc.line(x, ty, x + w, ty);
        });
        return;
      }

      case "compare": {
        const gap = 5;
        const aspectW = w * 0.2;
        const colW = (w - aspectW - gap) / 2;
        const headH = 8.4;
        font("bold", 8);
        ink(MUTED);
        doc.text(ascii(b.head[0].toUpperCase()), x + aspectW + 3.5, y + 5.6);
        fill(ACCENT_SOFT);
        doc.roundedRect(x + aspectW + colW + gap, y, colW, headH, 1.6, 1.6, "F");
        font("bold", 8);
        ink(ACCENT);
        doc.text(ascii(b.head[1].toUpperCase()), x + aspectW + colW + gap + 3.5, y + 5.6);

        let ty = y + headH + 1.5;
        const rowH = (h - headH - 1.5) / b.rows.length;
        b.rows.forEach((r) => {
          font("bold", 9);
          ink(INK);
          doc.text(wrap(r.aspect, aspectW - 4, 9, "bold").slice(0, 2), x, ty + 5.4);
          fill(BAD);
          doc.circle(x + aspectW + 5, ty + 4.4, 1.5, "F");
          para(r.a, x + aspectW + 9, ty + 5.4, colW - 13, rowH - 3, 8.5, MUTED);
          fill(CARD);
          doc.roundedRect(x + aspectW + colW + gap, ty - 1, colW, rowH - 1.5, 1.6, 1.6, "F");
          fill(OK);
          doc.circle(x + aspectW + colW + gap + 5, ty + 4.4, 1.5, "F");
          para(r.b, x + aspectW + colW + gap + 9, ty + 5.4, colW - 13, rowH - 3, 8.5, INK);
          ty += rowH;
        });
        return;
      }

      case "timeline": {
        const n = b.items.length;
        const cw = w / n;
        const railY = y + 13;
        draw(LINE);
        doc.setLineWidth(1);
        doc.line(x + cw / 2, railY, x + w - cw / 2, railY);
        b.items.forEach((it, k) => {
          const cx = x + cw * k + cw / 2;
          font("bold", 9);
          ink(ACCENT);
          doc.text(ascii(it.when.toUpperCase()), cx, y + 6, { align: "center" });
          fill(k === 0 ? ACCENT : PAPER);
          draw(ACCENT);
          doc.setLineWidth(0.9);
          doc.circle(cx, railY, 3.6, "FD");
          const bx = x + cw * k + 3;
          const by = railY + 8;
          card(bx, by, cw - 6, y + h - by);
          const tl = wrap(it.title, cw - 14, 10.5, "bold").slice(0, 2);
          font("bold", 10.5);
          ink(INK);
          doc.text(tl, bx + 4, by + 8);
          para(it.body, bx + 4, by + 8 + tl.length * 4.4 + 2, cw - 14, y + h - by - 16, 8.5, MUTED);
        });
        return;
      }

      case "bars": {
        let ty = y;
        if (b.caption) {
          font("bold", 8);
          ink(MUTED);
          doc.text(ascii(b.caption.toUpperCase()), x, ty + 4);
          ty += 9;
        }
        const max = Math.max(...b.items.map((v) => v.value));
        const rowH = (h - (b.caption ? 9 : 0)) / b.items.length;
        const labelW = w * 0.26;
        const trackW = w - labelW - 26;
        b.items.forEach((it) => {
          const barY = ty + rowH / 2 - 4.5;
          font("bold", 9.5);
          ink(INK);
          doc.text(ascii(it.label), x, barY + 6.2);
          fill(SOFT);
          doc.roundedRect(x + labelW, barY, trackW, 9, 1.8, 1.8, "F");
          fill(it.accent ? ACCENT : "B9AFA3");
          doc.roundedRect(
            x + labelW,
            barY,
            Math.max(5, (it.value / max) * trackW),
            9,
            1.8,
            1.8,
            "F",
          );
          font("bold", 10.5);
          ink(it.accent ? ACCENT : MUTED);
          doc.text(ascii(it.display), x + w, barY + 6.4, { align: "right" });
          ty += rowH;
        });
        return;
      }

      case "image": {
        const img = images[b.src];
        const capH = b.caption ? 7 : 0;
        if (img) {
          const f = fit(img.w, img.h, w, h - capH);
          fill(CARD);
          draw(LINE);
          doc.setLineWidth(0.3);
          doc.roundedRect(x + f.dx - 1.6, y + f.dy - 1.6, f.w + 3.2, f.h + 3.2, 2, 2, "FD");
          doc.addImage(img.data, "JPEG", x + f.dx, y + f.dy, f.w, f.h, undefined, "FAST");
        }
        if (b.caption) {
          font("italic", 8.5);
          ink(MUTED);
          doc.text(ascii(b.caption), x + w / 2, y + h - 1, { align: "center" });
        }
        return;
      }

      case "gallery": {
        const n = b.items.length;
        const gap = 5;
        const cw = (w - gap * (n - 1)) / n;
        b.items.forEach((g, k) => {
          const cx = x + k * (cw + gap);
          const img = images[g.src];
          const capH = 9;
          // Top-aligned so every caption in the row shares a baseline, and sits
          // against its image rather than on the floor of the block.
          let capY = y + h - 2;
          if (img) {
            const f = fit(img.w, img.h, cw, h - capH);
            fill(CARD);
            draw(LINE);
            doc.setLineWidth(0.3);
            doc.roundedRect(cx + f.dx - 1.4, y - 1.4, f.w + 2.8, f.h + 2.8, 2, 2, "FD");
            doc.addImage(img.data, "JPEG", cx + f.dx, y, f.w, f.h, undefined, "FAST");
            capY = y + f.h + 6;
          }
          const cl = wrap(g.caption, cw - 4, 8.5, "bold");
          font("bold", 8.5);
          ink(INK);
          doc.text(cl, cx + cw / 2, capY, { align: "center" });
        });
        return;
      }

      case "split": {
        const img = images[b.src];
        const imgW = w * 0.5;
        if (img) {
          const f = fit(img.w, img.h, imgW - 5, h);
          fill(CARD);
          draw(LINE);
          doc.setLineWidth(0.3);
          doc.roundedRect(x + f.dx - 1.6, y + f.dy - 1.6, f.w + 3.2, f.h + 3.2, 2, 2, "FD");
          doc.addImage(img.data, "JPEG", x + f.dx, y + f.dy, f.w, f.h, undefined, "FAST");
        }
        const rx = x + imgW + 6;
        const rw = w - imgW - 6;
        const rowH = h / b.items.length;
        b.items.forEach((it, k) => {
          const ry = y + k * rowH;
          fill(ACCENT);
          doc.circle(rx + 2, ry + 4, 1.7, "F");
          const tl = wrap(it.title, rw - 9, 10.5, "bold").slice(0, 1);
          font("bold", 10.5);
          ink(INK);
          doc.text(tl, rx + 7, ry + 5.5);
          para(it.body, rx + 7, ry + 10.5, rw - 9, rowH - 12, 8.5, MUTED);
        });
        return;
      }
    }
  }

  DECK.forEach((slide, i) => {
    if (i > 0) doc.addPage([PW, PH], "landscape");

    fill(PAPER);
    doc.rect(0, 0, PW, PH, "F");
    fill(ACCENT);
    doc.rect(0, 0, 2.6, PH, "F");

    font("bold", 8.5);
    ink(ACCENT);
    doc.text(ascii(`${slide.no ? slide.no + "   " : ""}${slide.kicker}`.toUpperCase()), M, 14);

    const titleLines = wrap(slide.title, PW - M * 2, 26, "normal", "times");
    font("normal", 26, "times");
    ink(INK);
    doc.text(titleLines, M, 25.5);

    const top = 34 + titleLines.length * 9;

    const heights = slide.blocks.map((b) =>
      b.kind === "lead"
        ? wrap(b.text, PW - M * 2, 12).length * 5.6 + 3
        : b.kind === "note"
          ? wrap(b.text, PW - M * 2 - 14, 9.5, "italic").length * 4.4 + 9
          : b.kind === "metrics"
            ? 30
            : null,
    );
    const used = heights.reduce<number>((a, v) => a + (v ?? 0), 0);
    const gaps = (slide.blocks.length - 1) * 5;
    const avail = BODY_BOT - top - used - gaps;
    const flexIdx = heights.map((v, n) => (v === null ? n : -1)).filter((n) => n >= 0);
    const share = flexIdx.length ? avail / flexIdx.length : 0;

    // A pipeline or a timeline stretched to five inches is mostly empty card.
    // Cap those, then hand the slack back to the blocks that do fill space.
    const resolved = [...heights];
    let slack = 0;
    const uncapped: number[] = [];
    for (const n of flexIdx) {
      const cap = CAP_MM[slide.blocks[n]!.kind];
      if (cap && share > cap) {
        resolved[n] = cap;
        slack += share - cap;
      } else {
        resolved[n] = share;
        uncapped.push(n);
      }
    }
    if (slack > 0 && uncapped.length) {
      for (const n of uncapped) resolved[n] = (resolved[n] ?? 0) + slack / uncapped.length;
      slack = 0;
    }

    // Nothing left that wants the space: centre the body instead of leaving a
    // hole under the last block.
    let y = top + (slack > 0 ? slack / 2 : 0);
    slide.blocks.forEach((b, n) => {
      const bh = Math.max(20, resolved[n] ?? share);
      drawBlock(b, M, y, PW - M * 2, bh);
      y += bh + 5;
    });

    draw(LINE);
    doc.setLineWidth(0.3);
    doc.line(M, PH - 10.5, PW - M, PH - 10.5);
    font("normal", 7.5);
    ink(MUTED);
    doc.text(
      ascii(`${DECK_META.title}  ·  ${DECK_META.problemId}  ·  Team ${DECK_META.team}`),
      M,
      PH - 5.5,
    );
    doc.text(`${i + 1} / ${DECK.length}`, PW - M, PH - 5.5, { align: "right" });
  });

  doc.save(filename);
}

/* ------------------------------------------------------------------ */
/* PPTX                                                                */
/* ------------------------------------------------------------------ */

/* eslint-disable @typescript-eslint/no-explicit-any */
export async function downloadDeckPptx(filename = "LabelCheck-SIH2026-Pitch.pptx") {
  const [mod, images] = await Promise.all([import("pptxgenjs"), loadImages()]);
  const PptxGenJS = mod.default;
  const pptx = new PptxGenJS();

  pptx.defineLayout({ name: "LC16x9", width: W, height: H });
  pptx.layout = "LC16x9";
  pptx.author = `Team ${DECK_META.team}`;
  pptx.company = DECK_META.ministry;
  pptx.title = `${DECK_META.title} — ${DECK_META.event}`;
  pptx.subject = `Problem statement ${DECK_META.problemId}`;

  const X = 0.62;
  const CW = W - 1.24;
  const BOT = H - 0.62;
  const CAP_IN: Partial<Record<Block["kind"], number>> = {
    pipeline: 2.45,
    timeline: 2.6,
    bars: 2.05,
    compare: 3.1,
  };

  DECK.forEach((slide, i) => {
    const s = pptx.addSlide();
    s.background = { color: PAPER };
    s.addNotes(slide.notes);

    s.addShape("rect", { x: 0, y: 0, w: 0.08, h: H, fill: { color: ACCENT } });
    s.addText(`${slide.no ? slide.no + "   " : ""}${slide.kicker}`.toUpperCase(), {
      x: X,
      y: 0.32,
      w: CW,
      h: 0.26,
      fontSize: 11,
      bold: true,
      color: ACCENT,
      charSpacing: 1.6,
    });
    s.addText(slide.title, {
      x: X,
      y: 0.58,
      w: CW,
      h: 0.82,
      fontSize: 27,
      color: INK,
      fontFace: "Georgia",
      valign: "top",
    });

    const TOP = 1.56;
    const fixed = slide.blocks.map((b) =>
      b.kind === "lead"
        ? 0.5
        : b.kind === "note"
          ? Math.min(1.1, 0.42 + b.text.length / 330)
          : b.kind === "metrics"
            ? 1.16
            : null,
    );
    const used = fixed.reduce<number>((a, v) => a + (v ?? 0), 0);
    const gaps = (slide.blocks.length - 1) * 0.17;
    const avail = BOT - TOP - used - gaps;
    const flexIdx = fixed.map((v, n) => (v === null ? n : -1)).filter((n) => n >= 0);
    const share = flexIdx.length ? avail / flexIdx.length : 0;

    const resolved = [...fixed];
    let slack = 0;
    const uncapped: number[] = [];
    for (const n of flexIdx) {
      const cap = CAP_IN[slide.blocks[n]!.kind];
      if (cap && share > cap) {
        resolved[n] = cap;
        slack += share - cap;
      } else {
        resolved[n] = share;
        uncapped.push(n);
      }
    }
    if (slack > 0 && uncapped.length) {
      for (const n of uncapped) resolved[n] = (resolved[n] ?? 0) + slack / uncapped.length;
      slack = 0;
    }

    let y = TOP + (slack > 0 ? slack / 2 : 0);
    slide.blocks.forEach((b, n) => {
      const h = Math.max(0.8, resolved[n] ?? share);
      addBlock(s, b, X, y, CW, h, images);
      y += h + 0.17;
    });

    s.addShape("rect", { x: X, y: H - 0.5, w: CW, h: 0.008, fill: { color: LINE } });
    s.addText(`${DECK_META.title}  ·  ${DECK_META.problemId}  ·  Team ${DECK_META.team}`, {
      x: X,
      y: H - 0.44,
      w: 8,
      h: 0.26,
      fontSize: 9,
      color: MUTED,
    });
    s.addText(`${i + 1} / ${DECK.length}`, {
      x: W - 1.9,
      y: H - 0.44,
      w: 1.28,
      h: 0.26,
      fontSize: 9,
      color: MUTED,
      align: "right",
    });
  });

  await pptx.writeFile({ fileName: filename });
}

function addBlock(
  s: any,
  b: Block,
  x: number,
  y: number,
  w: number,
  h: number,
  images: Record<string, Loaded>,
) {
  const shell = { fill: { color: CARD }, line: { color: LINE, width: 0.75 }, rectRadius: 0.06 };

  switch (b.kind) {
    case "lead":
      s.addText(b.text, { x, y, w, h, fontSize: 14, color: MUTED, valign: "top" });
      return;

    case "note":
      s.addShape("roundRect", { x, y, w, h, ...shell, fill: { color: SOFT } });
      s.addShape("rect", { x, y, w: 0.055, h, fill: { color: ACCENT } });
      s.addText(b.text, {
        x: x + 0.18,
        y,
        w: w - 0.34,
        h,
        fontSize: 11,
        italic: true,
        color: INK,
        valign: "middle",
      });
      return;

    case "metrics": {
      const gap = 0.16;
      const cw = (w - gap * (b.items.length - 1)) / b.items.length;
      b.items.forEach((st, n) => {
        const cx = x + n * (cw + gap);
        s.addShape("roundRect", { x: cx, y, w: cw, h, ...shell });
        s.addShape("rect", { x: cx, y, w: cw, h: 0.055, fill: { color: ACCENT } });
        s.addText(st.value, {
          x: cx + 0.14,
          y: y + 0.1,
          w: cw - 0.28,
          h: 0.48,
          fontSize: 27,
          color: ACCENT,
          fontFace: "Georgia",
        });
        s.addText(st.label, {
          x: cx + 0.14,
          y: y + 0.6,
          w: cw - 0.28,
          h: 0.44,
          fontSize: 10,
          color: MUTED,
        });
      });
      return;
    }

    case "cards": {
      const cols = b.cols;
      const rows = Math.ceil(b.items.length / cols);
      const gap = 0.16;
      const cw = (w - gap * (cols - 1)) / cols;
      const ch = (h - gap * (rows - 1)) / rows;
      b.items.forEach((it, n) => {
        const cx = x + (n % cols) * (cw + gap);
        const cy = y + Math.floor(n / cols) * (ch + gap);
        s.addShape("roundRect", { x: cx, y: cy, w: cw, h: ch, ...shell });
        let ty = cy + 0.1;
        if (it.badge) {
          s.addShape("roundRect", {
            x: cx + 0.14,
            y: ty,
            w: Math.min(cw - 0.28, 0.2 + it.badge.length * 0.072),
            h: 0.24,
            fill: { color: ACCENT_SOFT },
            rectRadius: 0.04,
          });
          s.addText(it.badge.toUpperCase(), {
            x: cx + 0.19,
            y: ty,
            w: cw - 0.3,
            h: 0.24,
            fontSize: 8,
            bold: true,
            color: ACCENT,
            valign: "middle",
          });
          ty += 0.3;
        }
        s.addText(it.title, {
          x: cx + 0.14,
          y: ty,
          w: cw - 0.28,
          h: 0.3,
          fontSize: 13,
          bold: true,
          color: INK,
        });
        s.addText(it.body, {
          x: cx + 0.14,
          y: ty + 0.3,
          w: cw - 0.28,
          h: Math.max(0.2, ch - (ty - cy) - 0.36),
          fontSize: 10,
          color: MUTED,
          valign: "top",
        });
      });
      return;
    }

    case "pipeline": {
      const n = b.items.length;
      const arrow = 0.24;
      const cw = (w - arrow * (n - 1)) / n;
      b.items.forEach((it, k) => {
        const cx = x + k * (cw + arrow);
        s.addShape("roundRect", { x: cx, y, w: cw, h, ...shell });
        s.addShape("ellipse", {
          x: cx + 0.14,
          y: y + 0.12,
          w: 0.32,
          h: 0.32,
          fill: { color: ACCENT },
        });
        s.addText(String(k + 1), {
          x: cx + 0.14,
          y: y + 0.12,
          w: 0.32,
          h: 0.32,
          fontSize: 11,
          bold: true,
          color: "FFFFFF",
          align: "center",
          valign: "middle",
        });
        s.addText(it.title, {
          x: cx + 0.14,
          y: y + 0.52,
          w: cw - 0.28,
          h: 0.3,
          fontSize: 12,
          bold: true,
          color: INK,
        });
        s.addText(it.body, {
          x: cx + 0.14,
          y: y + 0.84,
          w: cw - 0.28,
          h: Math.max(0.2, h - 1.4),
          fontSize: 9.5,
          color: MUTED,
          valign: "top",
        });
        if (it.out) {
          s.addShape("roundRect", {
            x: cx + 0.14,
            y: y + h - 0.42,
            w: cw - 0.28,
            h: 0.28,
            fill: { color: ACCENT_SOFT },
            rectRadius: 0.04,
          });
          s.addText(it.out, {
            x: cx + 0.2,
            y: y + h - 0.42,
            w: cw - 0.34,
            h: 0.28,
            fontSize: 8.5,
            bold: true,
            color: ACCENT,
            valign: "middle",
          });
        }
        if (k < n - 1) {
          s.addShape("rightArrow", {
            x: cx + cw + 0.04,
            y: y + h / 2 - 0.08,
            w: arrow - 0.08,
            h: 0.16,
            fill: { color: ACCENT },
          });
        }
      });
      return;
    }

    case "table": {
      const cols = b.head.length;
      const weights =
        cols === 3 ? [0.2, 0.28, 0.52] : cols === 2 ? [0.3, 0.7] : new Array(cols).fill(1 / cols);
      const rows = [
        b.head.map((hd) => ({
          text: hd.toUpperCase(),
          options: { bold: true, color: ACCENT, fontSize: 10, fill: { color: ACCENT_SOFT } },
        })),
        ...b.rows.map((r, ri) =>
          r.map((c, n) => ({
            text: c,
            options: {
              bold: n === 0,
              color: n === 0 ? INK : MUTED,
              fontSize: 9.5,
              fill: { color: ri % 2 ? PAPER : CARD },
            },
          })),
        ),
      ];
      s.addTable(rows, {
        x,
        y,
        w,
        colW: weights.map((f) => w * f),
        border: { type: "solid", color: LINE, pt: 0.5 },
        margin: 0.07,
        valign: "top",
        autoPage: false,
      });
      return;
    }

    case "compare": {
      const aspectW = w * 0.2;
      const gap = 0.16;
      const colW = (w - aspectW - gap) / 2;
      s.addText(b.head[0].toUpperCase(), {
        x: x + aspectW + 0.08,
        y,
        w: colW,
        h: 0.3,
        fontSize: 9.5,
        bold: true,
        color: MUTED,
        valign: "middle",
      });
      s.addShape("roundRect", {
        x: x + aspectW + colW + gap,
        y,
        w: colW,
        h: 0.3,
        fill: { color: ACCENT_SOFT },
        rectRadius: 0.04,
      });
      s.addText(b.head[1].toUpperCase(), {
        x: x + aspectW + colW + gap + 0.1,
        y,
        w: colW - 0.2,
        h: 0.3,
        fontSize: 9.5,
        bold: true,
        color: ACCENT,
        valign: "middle",
      });
      const rowH = (h - 0.38) / b.rows.length;
      b.rows.forEach((r, k) => {
        const ry = y + 0.38 + k * rowH;
        s.addText(r.aspect, {
          x,
          y: ry,
          w: aspectW - 0.1,
          h: rowH,
          fontSize: 10.5,
          bold: true,
          color: INK,
          valign: "top",
        });
        s.addText(
          [
            { text: "✕  ", options: { color: BAD, bold: true } },
            { text: r.a, options: { color: MUTED } },
          ],
          {
            x: x + aspectW + 0.08,
            y: ry,
            w: colW - 0.16,
            h: rowH,
            fontSize: 10,
            valign: "top",
          },
        );
        s.addShape("roundRect", {
          x: x + aspectW + colW + gap,
          y: ry - 0.04,
          w: colW,
          h: rowH - 0.06,
          fill: { color: CARD },
          rectRadius: 0.04,
        });
        s.addText(
          [
            { text: "✓  ", options: { color: OK, bold: true } },
            { text: r.b, options: { color: INK } },
          ],
          {
            x: x + aspectW + colW + gap + 0.1,
            y: ry,
            w: colW - 0.2,
            h: rowH,
            fontSize: 10,
            valign: "top",
          },
        );
      });
      return;
    }

    case "timeline": {
      const n = b.items.length;
      const cw = w / n;
      const railY = y + 0.46;
      s.addShape("rect", { x: x + cw / 2, y: railY, w: w - cw, h: 0.022, fill: { color: LINE } });
      b.items.forEach((it, k) => {
        const cx = x + cw * k;
        s.addText(it.when.toUpperCase(), {
          x: cx,
          y,
          w: cw,
          h: 0.3,
          fontSize: 11,
          bold: true,
          color: ACCENT,
          align: "center",
        });
        s.addShape("ellipse", {
          x: cx + cw / 2 - 0.1,
          y: railY - 0.09,
          w: 0.2,
          h: 0.2,
          fill: { color: k === 0 ? ACCENT : PAPER },
          line: { color: ACCENT, width: 1.25 },
        });
        const by = railY + 0.28;
        s.addShape("roundRect", { x: cx + 0.08, y: by, w: cw - 0.16, h: y + h - by, ...shell });
        s.addText(it.title, {
          x: cx + 0.2,
          y: by + 0.1,
          w: cw - 0.4,
          h: 0.3,
          fontSize: 12,
          bold: true,
          color: INK,
        });
        s.addText(it.body, {
          x: cx + 0.2,
          y: by + 0.42,
          w: cw - 0.4,
          h: Math.max(0.2, y + h - by - 0.5),
          fontSize: 9.5,
          color: MUTED,
          valign: "top",
        });
      });
      return;
    }

    case "bars": {
      let ty = y;
      if (b.caption) {
        s.addText(b.caption.toUpperCase(), {
          x,
          y: ty,
          w,
          h: 0.26,
          fontSize: 9.5,
          bold: true,
          color: MUTED,
        });
        ty += 0.34;
      }
      const max = Math.max(...b.items.map((v) => v.value));
      const rowH = (h - (b.caption ? 0.34 : 0)) / b.items.length;
      const labelW = w * 0.26;
      const trackW = w - labelW - 1.1;
      b.items.forEach((it) => {
        const barY = ty + rowH / 2 - 0.15;
        s.addText(it.label, {
          x,
          y: barY - 0.05,
          w: labelW - 0.1,
          h: 0.36,
          fontSize: 11,
          bold: true,
          color: INK,
          valign: "middle",
        });
        s.addShape("roundRect", {
          x: x + labelW,
          y: barY,
          w: trackW,
          h: 0.3,
          fill: { color: SOFT },
          rectRadius: 0.05,
        });
        s.addShape("roundRect", {
          x: x + labelW,
          y: barY,
          w: Math.max(0.14, (it.value / max) * trackW),
          h: 0.3,
          fill: { color: it.accent ? ACCENT : "B9AFA3" },
          rectRadius: 0.05,
        });
        s.addText(it.display, {
          x: x + w - 1.05,
          y: barY - 0.03,
          w: 1.05,
          h: 0.36,
          fontSize: 12,
          bold: true,
          color: it.accent ? ACCENT : MUTED,
          align: "right",
          valign: "middle",
        });
        ty += rowH;
      });
      return;
    }

    case "image": {
      const img = images[b.src];
      const capH = b.caption ? 0.3 : 0;
      if (img) {
        const f = fit(img.w, img.h, w, h - capH);
        s.addImage({ data: img.data, x: x + f.dx, y: y + f.dy, w: f.w, h: f.h });
      }
      if (b.caption) {
        s.addText(b.caption, {
          x,
          y: y + h - capH,
          w,
          h: capH,
          fontSize: 9.5,
          italic: true,
          color: MUTED,
          align: "center",
        });
      }
      return;
    }

    case "gallery": {
      const n = b.items.length;
      const gap = 0.18;
      const cw = (w - gap * (n - 1)) / n;
      b.items.forEach((g, k) => {
        const cx = x + k * (cw + gap);
        const img = images[g.src];
        const capH = 0.34;
        let capY = y + h - capH;
        if (img) {
          const f = fit(img.w, img.h, cw, h - capH);
          s.addImage({ data: img.data, x: cx + f.dx, y, w: f.w, h: f.h });
          capY = y + f.h + 0.08;
        }
        s.addText(g.caption, {
          x: cx,
          y: capY,
          w: cw,
          h: capH,
          fontSize: 10,
          bold: true,
          color: INK,
          align: "center",
        });
      });
      return;
    }

    case "split": {
      const img = images[b.src];
      const imgW = w * 0.5;
      if (img) {
        const f = fit(img.w, img.h, imgW - 0.2, h);
        s.addImage({ data: img.data, x: x + f.dx, y: y + f.dy, w: f.w, h: f.h });
      }
      const rx = x + imgW + 0.26;
      const rw = w - imgW - 0.26;
      const rowH = h / b.items.length;
      b.items.forEach((it, k) => {
        const ry = y + k * rowH;
        s.addShape("ellipse", { x: rx, y: ry + 0.11, w: 0.11, h: 0.11, fill: { color: ACCENT } });
        s.addText(it.title, {
          x: rx + 0.22,
          y: ry,
          w: rw - 0.22,
          h: 0.28,
          fontSize: 12,
          bold: true,
          color: INK,
        });
        s.addText(it.body, {
          x: rx + 0.22,
          y: ry + 0.28,
          w: rw - 0.22,
          h: Math.max(0.2, rowH - 0.32),
          fontSize: 9.5,
          color: MUTED,
          valign: "top",
        });
      });
      return;
    }
  }
}
/* eslint-enable @typescript-eslint/no-explicit-any */

export type { DeckSlide };
