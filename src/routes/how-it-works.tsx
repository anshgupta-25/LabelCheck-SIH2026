import { createFileRoute, Link } from "@tanstack/react-router";
import { motion, useReducedMotion } from "motion/react";
import {
  Camera,
  ScanText,
  Regex,
  ShieldCheck,
  Database,
  ArrowRight,
  Scale,
  Boxes,
  Languages,
  Store,
  Server,
  Lock,
  Gauge,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Reveal } from "@/components/site/Reveal";
import { GlowCard, IconTile } from "@/components/site/GlowCard";
import { RULES, LEGAL_BASIS, type RuleKey } from "@/lib/compliance";

export const Route = createFileRoute("/how-it-works")({
  head: () => ({
    meta: [
      { title: "How LabelCheck works — architecture & legal basis" },
      {
        name: "description",
        content:
          "The LabelCheck pipeline: image capture, vision-model text extraction, a modular Rule 6 detection engine, confidence scoring and a cited compliance report.",
      },
      { property: "og:title", content: "How LabelCheck works" },
      {
        property: "og:description",
        content:
          "Architecture, rule engine design and the statutory basis behind LabelCheck's compliance verdicts.",
      },
    ],
  }),
  component: HowItWorks,
});

/** The five pipeline stages, each with the artefact it hands to the next. */
const FLOW = [
  {
    icon: Camera,
    title: "Image",
    body: "Photo of the principal display panel, from any phone — one label or a batch of up to eight.",
    out: "label.jpg",
  },
  {
    icon: ScanText,
    title: "Text extraction",
    body: "A vision model transcribes every printed line server-side; credentials never reach the browser.",
    out: "raw_text: string",
  },
  {
    icon: Regex,
    title: "Rule engine",
    body: "Seven modular detectors: regex for MRP, dates, quantities, e-mail and phone, plus address heuristics.",
    out: "7 × outcome",
  },
  {
    icon: ShieldCheck,
    title: "Confidence scoring",
    body: "Pattern strength blended with capture legibility gives a 0-100% score for every declaration.",
    out: "0-100 per field",
  },
  {
    icon: Database,
    title: "Compliance report",
    body: "Verdict, per-field values, citations and raw text — logged for audit, exportable as a cited PDF with a QR link.",
    out: "verdict + PDF",
  },
];

/**
 * How each declaration is actually found, described from the detectors in
 * src/lib/compliance.ts. This is the page a judge reaches from "how each rule
 * is detected", so it must match the code rather than paraphrase the statute.
 */
const DETECTION: Record<RuleKey, string> = {
  manufacturer:
    "A declaration lead-in — “Manufactured by”, “Packed by”, “Marketed by” — first. Failing that, an address heuristic: a six-digit PIN code sitting alongside entity keywords. A PIN code raises the confidence.",
  commodity_name:
    "An explicit “Name:” declaration scores highest; otherwise a generic-commodity vocabulary match. A brand name on its own never satisfies the rule.",
  net_quantity:
    "Three patterns, strongest first: a “Net Qty” declaration carrying a unit, a bare standard-unit amount, then a count (N, U, pcs). Every candidate is validated, so “0 g” is skipped rather than accepted.",
  manufacture_date:
    "A labelled Mfd/Mfg/Packed date, a month-name and year, or an MM/YYYY pattern — then a plausibility check. An impossible or out-of-range date fails instead of passing as “present”.",
  mrp: "An “MRP ₹ …” declaration, or a bare rupee amount at lower confidence. ₹0 and blank prices are rejected, and “inclusive of all taxes” wording raises the score.",
  consumer_care:
    "E-mail and Indian phone-number patterns, including 1800 toll-free forms. Both present scores highest; either alone is accepted at lower confidence, and a “Consumer care” heading lifts it further.",
  country_of_origin:
    "“Made in / Manufactured in / Product of …” in any case, plus the Devanagari form, filtered through a country whitelist so a stray phrase cannot pass as an origin declaration.",
};

const STACK = [
  {
    icon: Server,
    title: "TanStack Start on the edge",
    body: "React 19 with server functions and SSR. OCR runs inside a server function, so the API key is never shipped to the browser.",
  },
  {
    icon: Lock,
    title: "Postgres with row-level security",
    body: "Supabase Postgres and a private storage bucket. Ownership is enforced in the database, not the UI — a user can only touch their own inspections.",
  },
  {
    icon: Gauge,
    title: "Stateless and horizontal",
    body: "Nothing is held between requests, so the same pipeline behind an API is how a marketplace would pre-check an entire catalogue.",
  },
];

const ROADMAP = [
  {
    icon: Boxes,
    title: "Catalogue-scale batches",
    body: "Batch checking of up to eight labels ships today. Next: whole-catalogue uploads with a consolidated per-SKU compliance sheet, exportable as CSV for enforcement drives.",
  },
  {
    icon: Store,
    title: "E-commerce scanning",
    body: "Point LabelCheck at a marketplace listing URL to verify the mandatory declarations that Rule 6 requires online sellers to display, at catalogue scale.",
  },
  {
    icon: Languages,
    title: "Regional languages",
    body: "Tamil, Telugu, Bengali, Marathi and Gujarati label transcription, with script-aware detectors for quantity and price declarations.",
  },
];

/**
 * The rail above the pipeline cards: a hairline with a light sweeping along it
 * and a node centred over each of the five columns (10%, 30%, 50%, 70%, 90%),
 * each pulsing as the sweep reaches it.
 */
function PipelineRail() {
  const reduce = useReducedMotion();

  return (
    <div aria-hidden className="relative mb-5 hidden h-8 lg:block">
      <span className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-gradient-to-r from-transparent via-border to-transparent" />

      {!reduce && (
        <motion.span
          className="absolute top-1/2 h-px w-1/4 -translate-y-1/2 bg-gradient-to-r from-transparent via-accent to-transparent"
          animate={{ left: ["-25%", "100%"] }}
          transition={{ duration: 4.5, repeat: Infinity, ease: "linear" }}
        />
      )}

      {FLOW.map((f, i) => (
        <span
          key={f.title}
          className="absolute top-1/2 flex size-2.5 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-accent bg-background"
          style={{ left: `${10 + i * 20}%` }}
        >
          {/* Filled centre that flares as the sweep passes. Kept as its own
              element because Motion cannot interpolate a var() colour. */}
          <motion.span
            className="size-full rounded-full bg-accent"
            initial={{ opacity: 0, scale: 0.4 }}
            animate={
              reduce ? { opacity: 0.35, scale: 1 } : { opacity: [0, 1, 0], scale: [0.4, 1.8, 0.4] }
            }
            transition={{ duration: 4.5, repeat: Infinity, times: [0, 0.08, 0.28], delay: i * 0.9 }}
          />
        </span>
      ))}
    </div>
  );
}

function HowItWorks() {
  return (
    <div>
      {/* ------------------------------------------------------------------ */}
      {/* Header + pipeline                                                   */}
      {/* ------------------------------------------------------------------ */}
      <section className="bg-hero-gradient relative overflow-hidden border-b border-border">
        <div
          aria-hidden
          className="bg-grid-paper pointer-events-none absolute inset-0 opacity-50 [mask-image:radial-gradient(75%_65%_at_50%_20%,black,transparent)]"
        />

        <div className="relative mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <Badge variant="secondary" className="rounded-full">
              Architecture
            </Badge>
            <h1 className="mt-4 text-4xl sm:text-5xl">How LabelCheck works</h1>
            <p className="mt-3 max-w-2xl leading-relaxed text-muted-foreground">
              A five-stage pipeline built so every verdict can be traced back to a statutory clause
              and to the exact text that triggered it.
            </p>
          </motion.div>

          <div className="mt-10">
            <PipelineRail />

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {FLOW.map((f, i) => (
                <GlowCard key={f.title} delay={i * 0.09} spotlight={200} className="bg-card/80">
                  <div className="flex h-full flex-col p-5">
                    <div className="flex items-center justify-between gap-2">
                      <IconTile icon={f.icon} size="sm" />
                      <span className="font-mono text-[0.65rem] text-muted-foreground">
                        0{i + 1}
                      </span>
                    </div>
                    <p className="mt-3 font-display text-base font-bold">{f.title}</p>
                    <p className="mt-1.5 flex-1 text-xs leading-relaxed text-muted-foreground">
                      {f.body}
                    </p>
                    <p className="mt-4 truncate rounded-md border border-border bg-secondary/70 px-2 py-1 font-mono text-[0.62rem] text-accent">
                      → {f.out}
                    </p>
                  </div>
                </GlowCard>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* The seven detectors                                                 */}
      {/* ------------------------------------------------------------------ */}
      <section className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
        <Reveal>
          <p className="eyebrow text-accent">The rule engine</p>
          <h2 className="mt-3 text-3xl sm:text-4xl">How each declaration is detected</h2>
          <p className="mt-3 max-w-3xl leading-relaxed text-muted-foreground">
            Each declaration is a self-contained detector. It validates rather than merely spots a
            keyword — a zero quantity, a blank price or an impossible date all fail. Adding a new
            rule, say the FSSAI licence number, is one object in the rules array.
          </p>
        </Reveal>

        <div className="mt-8 grid gap-3 lg:grid-cols-2">
          {RULES.map((r, i) => (
            <GlowCard key={r.key} delay={i * 0.05} spotlight={260}>
              <div className="p-5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-primary text-[11px] font-semibold text-primary-foreground">
                    {i + 1}
                  </span>
                  <Badge variant="outline" className="font-mono text-[0.68rem]">
                    {r.ruleRef}
                  </Badge>
                  <p className="font-semibold">{r.label}</p>
                  {!r.critical && (
                    <Badge variant="secondary" className="text-[10px]">
                      Advisory — does not fail the verdict on its own
                    </Badge>
                  )}
                </div>
                <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">
                  {r.requirement}
                </p>
                <div className="mt-3 rounded-lg border border-border bg-secondary/60 p-3">
                  <p className="eyebrow text-accent">How it is detected</p>
                  <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                    {DETECTION[r.key]}
                  </p>
                </div>
              </div>
            </GlowCard>
          ))}
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Under the hood                                                      */}
      {/* ------------------------------------------------------------------ */}
      <section className="border-y border-border bg-secondary/40 py-16">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
          <Reveal>
            <p className="eyebrow text-accent">Under the hood</p>
            <h2 className="mt-3 text-3xl sm:text-4xl">Built to be handed to someone else</h2>
            <p className="mt-3 max-w-2xl leading-relaxed text-muted-foreground">
              Nothing here is a demo shim. The same code path runs in the field, in a batch and
              behind an API.
            </p>
          </Reveal>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {STACK.map((t, i) => (
              <GlowCard key={t.title} delay={i * 0.1}>
                <div className="p-6">
                  <IconTile icon={t.icon} size="sm" />
                  <h3 className="mt-4 font-semibold">{t.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t.body}</p>
                </div>
              </GlowCard>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Legal basis                                                         */}
      {/* ------------------------------------------------------------------ */}
      <section className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
        <Reveal>
          <div className="relative overflow-hidden rounded-3xl border border-border bg-card p-6 shadow-soft sm:p-8">
            <div
              aria-hidden
              className="bg-grid-paper pointer-events-none absolute inset-0 opacity-40 [mask-image:radial-gradient(60%_80%_at_100%_0%,black,transparent)]"
            />
            <div className="relative flex items-center gap-3">
              <span className="bg-primary-gradient flex size-11 items-center justify-center rounded-xl text-primary-foreground">
                <Scale className="size-5" />
              </span>
              <h2 className="text-2xl font-bold">Legal basis</h2>
            </div>
            <p className="relative mt-4 max-w-3xl text-sm leading-relaxed text-muted-foreground">
              The <span className="font-semibold text-foreground">{LEGAL_BASIS.act}</span>{" "}
              establishes the national standards of weights and measures and empowers the Central
              Government to regulate pre-packaged commodities. The{" "}
              <span className="font-semibold text-foreground">{LEGAL_BASIS.rules}</span> operate
              under that Act;{" "}
              <span className="font-semibold text-foreground">{LEGAL_BASIS.clause}</span> lists the
              declarations that must appear on every retail package. Chapter II further governs the
              manner of declaration — the size, prominence and placement of the text on the
              principal display panel.
            </p>
            <p className="relative mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground">
              LabelCheck reports the presence and content of each declaration and cites the clause
              it derives from. It is a decision-support tool for inspectors, manufacturers and
              marketplaces — the statutory determination remains with the Legal Metrology officer.
            </p>
          </div>
        </Reveal>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Roadmap                                                             */}
      {/* ------------------------------------------------------------------ */}
      <section className="border-t border-border bg-secondary/40 py-16">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
          <Reveal>
            <p className="eyebrow text-accent">Next</p>
            <h2 className="mt-3 text-3xl sm:text-4xl">Roadmap</h2>
          </Reveal>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {ROADMAP.map((r, i) => (
              <GlowCard key={r.title} delay={i * 0.1} className="border-dashed">
                <div className="p-6">
                  <IconTile icon={r.icon} size="sm" />
                  <h3 className="mt-4 font-semibold">{r.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{r.body}</p>
                </div>
              </GlowCard>
            ))}
          </div>

          <Reveal delay={0.2}>
            <div className="mt-10">
              <Button asChild size="lg" className="h-12 px-6">
                <Link to="/scan">
                  Try it on a label <ArrowRight className="size-4" />
                </Link>
              </Button>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
