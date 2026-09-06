import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import { useRef, useState } from "react";
import { ArrowLeft, FileDown, Loader2, Maximize2, Presentation } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Deck } from "@/components/pitch/Deck";
import { DECK } from "@/lib/deck-content";

export const Route = createFileRoute("/pitch")({
  head: () => ({
    meta: [
      { title: "LabelCheck — SIH 2026 Pitch" },
      {
        name: "description",
        content:
          "The LabelCheck pitch deck for Smart India Hackathon 2026, problem statement SIH26034, Ministry of Consumer Affairs.",
      },
      { property: "og:title", content: "LabelCheck — SIH 2026 Pitch" },
      {
        property: "og:description",
        content: "Our presentation for SIH26034: AI-powered Legal Metrology label compliance.",
      },
    ],
  }),
  component: PitchPage,
});

function PitchPage() {
  const fullscreenRef = useRef<(() => void) | null>(null);
  // "pdf" | "pptx" while that export is generating; both libraries are loaded
  // on demand, so the first click has a moment of work to do.
  const [busy, setBusy] = useState<"pdf" | "pptx" | null>(null);

  async function download(kind: "pdf" | "pptx") {
    if (busy) return;
    setBusy(kind);
    try {
      const mod = await import("@/lib/deck-export");
      if (kind === "pdf") await mod.downloadDeckPdf();
      else await mod.downloadDeckPptx();
      toast.success(`Deck exported as ${kind.toUpperCase()}`, {
        description: `${DECK.length} slides${kind === "pptx" ? ", with speaker notes" : ""}.`,
      });
    } catch (err) {
      toast.error("Export failed", {
        description: err instanceof Error ? err.message : "Please try again.",
      });
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Badge variant="secondary" className="rounded-full">
          <Presentation className="size-3.5" /> Presentation
        </Badge>
        <h1 className="mt-4 text-4xl sm:text-5xl">LabelCheck — SIH 2026 Pitch</h1>
        <p className="mt-3 text-muted-foreground">
          Making every packaged label legally verifiable in seconds — problem statement SIH26034,
          Ministry of Consumer Affairs. {DECK.length} slides covering problem validation, user
          requirements, architecture, technology choices, the working prototype, test results and
          impact. Download it as PowerPoint (with speaker notes) or PDF.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <Button asChild variant="outline">
            <Link to="/">
              <ArrowLeft className="size-4" /> Back to App
            </Link>
          </Button>
          <Button onClick={() => fullscreenRef.current?.()}>
            <Maximize2 className="size-4" /> Open in full screen
          </Button>
          <Button variant="outline" onClick={() => void download("pptx")} disabled={busy !== null}>
            {busy === "pptx" ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <FileDown className="size-4" />
            )}
            Download PPTX
          </Button>
          <Button variant="outline" onClick={() => void download("pdf")} disabled={busy !== null}>
            {busy === "pdf" ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <FileDown className="size-4" />
            )}
            Download PDF
          </Button>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.55, delay: 0.1 }}
        className="mt-8"
      >
        <Deck fullscreenRef={fullscreenRef} />
      </motion.div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {[
          { k: "Problem", v: "Label declarations are checked manually, one product at a time." },
          { k: "Solution", v: "Photograph a label, get a cited Rule 6 verdict in seconds." },
          { k: "Impact", v: "Faster enforcement, fewer misleading packs, informed consumers." },
        ].map((c) => (
          <div key={c.k} className="rounded-2xl border border-border bg-card p-5 shadow-soft">
            <p className="text-xs font-semibold uppercase tracking-wide text-primary">{c.k}</p>
            <p className="mt-2 text-sm text-muted-foreground">{c.v}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
