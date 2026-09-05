import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "motion/react";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Reveal } from "@/components/site/Reveal";
import { RULES, LEGAL_BASIS } from "@/lib/compliance";

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

const FLOW = [
  {
    icon: Camera,
    title: "Image",
    body: "Photo of the principal display panel, from any phone — one label or a batch of up to eight.",
  },
  {
    icon: ScanText,
    title: "Text extraction",
    body: "A vision model transcribes every printed line server-side; credentials never reach the browser.",
  },
  {
    icon: Regex,
    title: "Rule engine",
    body: "Modular detectors: regex for MRP, dates, quantities, e-mail and phone, plus address heuristics.",
  },
  {
    icon: ShieldCheck,
    title: "Confidence scoring",
    body: "Pattern strength blended with capture legibility gives a 0-100% score per declaration.",
  },
  {
    icon: Database,
    title: "Compliance report",
    body: "Verdict, per-field values, citations and raw text — logged for audit, exportable as a cited PDF with a QR link to the live verdict.",
  },
];

function HowItWorks() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <Badge variant="secondary" className="rounded-full">
          Architecture
        </Badge>
        <h1 className="mt-4 text-4xl sm:text-5xl">How LabelCheck works</h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          A five-stage pipeline built so every verdict can be traced back to a statutory clause and
          to the exact text that triggered it.
        </p>
      </motion.div>

      {/* Animated flow diagram */}
      <div className="mt-12 overflow-hidden rounded-3xl border border-border bg-card p-6 shadow-soft sm:p-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-stretch">
          {FLOW.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.12 * i, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-1 items-center gap-4 lg:flex-col lg:items-stretch"
            >
              <div className="h-full flex-1 rounded-2xl border border-border bg-background p-5">
                <span className="bg-primary-gradient flex size-10 items-center justify-center rounded-xl text-primary-foreground">
                  <f.icon className="size-5" />
                </span>
                <p className="mt-3 font-display text-sm font-bold">{f.title}</p>
                <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{f.body}</p>
              </div>
              {i < FLOW.length - 1 && (
                <motion.span
                  animate={{ x: [0, 5, 0], y: [0, 0, 0] }}
                  transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                  className="shrink-0 text-primary lg:rotate-90"
                >
                  <ArrowRight className="size-5" />
                </motion.span>
              )}
            </motion.div>
          ))}
        </div>
      </div>

      {/* Rules table */}
      <section className="mt-16">
        <Reveal>
          <h2 className="text-2xl font-bold sm:text-3xl">The seven mandatory declarations</h2>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Each declaration is a self-contained detector in the rule engine. Adding a new rule —
            say the FSSAI licence number or a "best before" date — is one object in the rules array.
          </p>
        </Reveal>

        <div className="mt-6 space-y-3">
          {RULES.map((r, i) => (
            <Reveal key={r.key} delay={i * 0.05}>
              <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline">{r.ruleRef}</Badge>
                  <p className="font-semibold">{r.label}</p>
                  {!r.critical && (
                    <Badge variant="secondary" className="text-[10px]">
                      Advisory — does not fail the verdict on its own
                    </Badge>
                  )}
                </div>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {r.requirement}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Legal basis */}
      <section className="mt-16">
        <Reveal>
          <div className="rounded-3xl border border-border bg-secondary/50 p-6 sm:p-8">
            <div className="flex items-center gap-3">
              <span className="bg-primary-gradient flex size-11 items-center justify-center rounded-xl text-primary-foreground">
                <Scale className="size-5" />
              </span>
              <h2 className="text-2xl font-bold">Legal basis</h2>
            </div>
            <p className="mt-4 max-w-3xl text-sm leading-relaxed text-muted-foreground">
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
            <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground">
              LabelCheck reports the presence and content of each declaration and cites the clause
              it derives from. It is a decision-support tool for inspectors, manufacturers and
              marketplaces — the statutory determination remains with the Legal Metrology officer.
            </p>
          </div>
        </Reveal>
      </section>

      {/* Roadmap */}
      <section className="mt-16">
        <Reveal>
          <h2 className="text-2xl font-bold sm:text-3xl">Roadmap</h2>
        </Reveal>
        <div className="mt-6 grid gap-5 md:grid-cols-3">
          {[
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
          ].map((r, i) => (
            <Reveal key={r.title} delay={i * 0.1}>
              <div className="h-full rounded-2xl border border-dashed border-border bg-card p-6">
                <r.icon className="size-6 text-accent" />
                <h3 className="mt-4 font-bold">{r.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{r.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <div className="mt-14">
        <Button asChild size="lg" className="h-12 px-6">
          <Link to="/scan">
            Try it on a label <ArrowRight className="size-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
