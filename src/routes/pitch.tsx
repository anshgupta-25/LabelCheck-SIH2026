import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import { useRef } from "react";
import { ArrowLeft, Maximize2, Presentation } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Deck } from "@/components/pitch/Deck";


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
          Ministry of Consumer Affairs.
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
