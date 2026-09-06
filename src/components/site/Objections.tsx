/**
 * The questions a Legal Metrology judge actually asks, answered on the page.
 *
 * Deliberately honest: the fraud answer names the limit rather than dodging it,
 * because "we solve compliance checking, not forgery" reads as competence.
 * Kept in sync with docs/JUDGES-QA.md.
 */
import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface Objection {
  q: string;
  a: string;
  /** Shown as a small tag; the honest framing of what kind of answer this is. */
  tag: string;
}

const OBJECTIONS: Objection[] = [
  {
    tag: "Accuracy",
    q: "How accurate is the extraction? What if it misreads a label?",
    a: "Every declaration carries its own confidence score, and the complete raw transcription is one click away on the report — it is auditable, not a black box. Any field can be corrected in place, and the verdict recalculates the moment you do. We would rather show an honest confidence figure than claim a fake 100%.",
  },
  {
    tag: "The hard one",
    q: "What stops someone printing a fake but compliant-looking label?",
    a: "Nothing here, and we would rather say so plainly. Rule 6 requires the declarations to be present and valid, and that is precisely what this verifies. Detecting forgery is a different layer: role-based officer accounts, MRP cross-checks against permitted ranges, and lookups against government registration databases. We are the scalable first line of defence, not a fraud detector.",
  },
  {
    tag: "Languages",
    q: "Indian packaging is in Hindi and regional languages. Does this cope?",
    a: "English and Hindi work today, with Devanagari transcribed alongside Latin script in a single pass. Tamil, Telugu, Bengali, Marathi and Gujarati are next. The vision model already reads those scripts, so adding them is a prompt and a test set rather than a rewrite.",
  },
  {
    tag: "Why not a human",
    q: "How is this better than an officer simply reading the label?",
    a: "Scale and consistency. A person manages roughly one pack a minute and tires; this applies Rule 6 identically every time, in about six seconds, citing the exact sub-rule and logging the result for audit. No inspectorate can eyeball crores of e-commerce listings by hand.",
  },
  {
    tag: "Legal basis",
    q: "Is the compliance logic actually legally correct?",
    a: "Each of the seven checks maps to a specific clause of Rule 6(1), (a) through (g), modelled directly on the Legal Metrology (Packaged Commodities) Rules, 2011. Every violation is reported with its sub-rule and a plain-language explanation. It validates rather than merely detects: a zero quantity, a blank price or an implausible date all fail.",
  },
  {
    tag: "Scale",
    q: "Can this handle millions of products?",
    a: "The pipeline is stateless and scales horizontally. Batch mode checks eight labels in a single pass today, and the same engine behind an API is how a marketplace would pre-check an entire catalogue before anything goes live.",
  },
];

export function Objections() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="mt-10 divide-y divide-border overflow-hidden rounded-3xl border border-border bg-card shadow-soft">
      {OBJECTIONS.map((o, i) => {
        const isOpen = open === i;
        return (
          <div key={o.q}>
            <button
              type="button"
              onClick={() => setOpen(isOpen ? null : i)}
              aria-expanded={isOpen}
              className="group flex w-full items-start gap-4 px-5 py-5 text-left transition-colors hover:bg-secondary/50 sm:px-7"
            >
              <span className="mt-0.5 shrink-0 rounded-full border border-accent/40 bg-accent/10 px-2.5 py-0.5 text-[10px] font-semibold tracking-wide text-accent uppercase">
                {o.tag}
              </span>
              <span className="min-w-0 flex-1 text-base font-semibold sm:text-lg">{o.q}</span>
              <motion.span
                animate={{ rotate: isOpen ? 45 : 0 }}
                transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                className={cn(
                  "mt-0.5 shrink-0 rounded-full border border-border p-1.5 transition-colors",
                  isOpen ? "border-accent text-accent" : "text-muted-foreground",
                )}
              >
                <Plus className="size-4" />
              </motion.span>
            </button>

            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
                  className="overflow-hidden"
                >
                  <p className="max-w-3xl px-5 pb-6 text-sm leading-relaxed text-muted-foreground sm:px-7 sm:text-base">
                    {o.a}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
