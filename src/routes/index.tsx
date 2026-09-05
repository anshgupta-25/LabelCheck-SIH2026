import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import {
  ScanLine,
  Presentation,
  Camera,
  Cpu,
  FileCheck2,
  ArrowRight,
  Languages,
  Eye,
  PencilLine,
  Database,
  Layers,
  FileDown,
  QrCode,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Reveal, CountUp } from "@/components/site/Reveal";
import { WireGlobe } from "@/components/site/WireGlobe";
import { BatchArt, ReportArt, ShareArt } from "@/components/site/FeatureArt";
import { RULES } from "@/lib/compliance";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "LabelCheck — Instant label compliance for India's Legal Metrology Rules" },
      {
        name: "description",
        content:
          "Photograph a product label — or a batch of eight — and get an instant Rule 6 compliance verdict: all 7 mandatory declarations checked, with confidence scores, legal citations and a shareable PDF report.",
      },
      { property: "og:title", content: "LabelCheck — Instant label compliance scanner" },
      {
        property: "og:description",
        content:
          "AI-powered Legal Metrology (Packaged Commodities) Rules, 2011 compliance verification. SIH 2026 · SIH26034.",
      },
    ],
  }),
  component: Home,
});

const STEPS = [
  {
    icon: Camera,
    title: "Capture the label",
    body: "Photograph or upload the principal display panel — one pack, or up to eight at once for a batch check. Works on any phone, in the field.",
  },
  {
    icon: Cpu,
    title: "Extract & analyse",
    body: "A vision model transcribes every printed line; the rule engine pattern-matches each mandatory declaration.",
  },
  {
    icon: FileCheck2,
    title: "Get the verdict",
    body: "A per-field checklist with confidence scores, extracted values and the exact legal citation for every violation — exportable as a cited PDF.",
  },
];

const SHOWCASE = [
  {
    eyebrow: "Batch check",
    title: "Eight labels, one table of verdicts",
    body: "Drop a whole shelf of photos at once. Each label is scanned in turn and stamped compliant or not, with the missing declarations listed — the pre-listing check an e-commerce catalogue team needs.",
    cta: "Try a batch",
    to: "/scan" as const,
    search: undefined,
    Art: BatchArt,
  },
  {
    eyebrow: "PDF evidence",
    title: "An officer-ready report in one click",
    body: "Every verdict exports to a cited PDF: the declarations table, the violations with their sub-rules, the label photo and the raw extracted text — ready to attach to an inspection file.",
    cta: "See a sample report",
    to: "/scan" as const,
    search: { demo: "non-compliant" },
    Art: ReportArt,
  },
  {
    eyebrow: "Share link + QR",
    title: "A permanent link to the live verdict",
    body: "Each report has its own URL and a QR code printed on the PDF. Scan it from the pack, the file or a colleague's phone and the current verdict opens instantly.",
    cta: "Browse past reports",
    to: "/history" as const,
    search: undefined,
    Art: ShareArt,
  },
];

const DIFFERENTIATORS = [
  {
    icon: Languages,
    title: "Multilingual",
    body: "English and Hindi labels today, with Devanagari transcription. Regional scripts on the roadmap.",
  },
  {
    icon: Eye,
    title: "Fully auditable",
    body: "Every report exposes the raw extracted text and a per-field confidence score. No black box.",
  },
  {
    icon: PencilLine,
    title: "Inspector-correctable",
    body: "Any mis-read field can be corrected in place; the verdict recomputes instantly and the fix is saved.",
  },
  {
    icon: Database,
    title: "Logged for audit",
    body: "Every inspection lands in a searchable history with verdict, timestamp and the full per-field result set.",
  },
];

function Home() {
  return (
    <div>
      {/* ------------------------------------------------------------------ */}
      {/* Hero                                                                */}
      {/* ------------------------------------------------------------------ */}
      <section className="bg-hero-gradient relative overflow-hidden border-b border-border">
        <div
          aria-hidden
          className="bg-grid-paper pointer-events-none absolute inset-0 opacity-60 [mask-image:radial-gradient(80%_70%_at_40%_35%,black,transparent)]"
        />

        <div className="relative mx-auto grid w-full max-w-6xl items-center gap-10 px-4 py-16 sm:px-6 sm:py-24 lg:grid-cols-[0.95fr_1.05fr]">
          <motion.div
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            className="relative order-2 lg:order-1"
          >
            <WireGlobe className="mx-auto aspect-square w-full max-w-[26rem]" />
          </motion.div>

          <div className="order-1 lg:order-2">
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="inline-flex items-center gap-2 rounded-full border border-border bg-card/80 px-4 py-1.5 text-xs text-muted-foreground backdrop-blur"
            >
              <span className="animate-blink size-1.5 rounded-full bg-accent" />
              Smart India Hackathon 2026 · SIH26034
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 22 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
              className="mt-6 max-w-2xl text-5xl leading-[0.98] sm:text-7xl"
            >
              Every label,
              <br />
              <span className="italic text-accent">under scrutiny.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 22 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, delay: 0.16, ease: [0.22, 1, 0.36, 1] }}
              className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg"
            >
              LabelCheck scans a photo of any pre-packaged commodity — or a batch of them — and
              verifies all seven mandatory declarations required by Rule 6 of the Legal Metrology
              (Packaged Commodities) Rules, 2011, with confidence scores, the exact statutory
              citation for every violation, and a shareable PDF report.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 22 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, delay: 0.24, ease: [0.22, 1, 0.36, 1] }}
              className="mt-8 flex flex-wrap gap-3"
            >
              <Button asChild size="lg" className="h-12 rounded-xl px-6 text-base">
                <Link to="/scan">
                  <ScanLine className="size-5" />
                  Scan a Label
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="h-12 rounded-xl bg-card/70 px-6 text-base"
              >
                <Link to="/pitch">
                  <Presentation className="size-5" />
                  View Our Pitch
                </Link>
              </Button>
              <Button asChild size="lg" variant="ghost" className="h-12 rounded-xl px-6 text-base">
                <Link to="/scan" search={{ demo: "compliant" }}>
                  Try a Demo
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
            </motion.div>

            {/* capability strip */}
            <motion.ul
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.34 }}
              className="mt-8 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground"
            >
              {[
                { icon: Layers, label: "Batch up to 8 labels" },
                { icon: FileDown, label: "Cited PDF report" },
                { icon: QrCode, label: "Share link + QR" },
              ].map((c) => (
                <li key={c.label} className="inline-flex items-center gap-1.5">
                  <c.icon className="size-4 text-accent" /> {c.label}
                </li>
              ))}
            </motion.ul>

            {/* Declaration chips */}
            <div className="mt-8 flex flex-wrap gap-2">
              {RULES.map((r, i) => (
                <motion.span
                  key={r.key}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + i * 0.06, duration: 0.4 }}
                  className="rounded-full border border-border bg-card/70 px-3 py-1.5 font-mono text-[0.68rem] text-muted-foreground backdrop-blur"
                >
                  {r.ruleRef} · {r.label}
                </motion.span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Impact stats                                                        */}
      {/* ------------------------------------------------------------------ */}
      <section className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { value: 7, suffix: "", label: "Mandatory declarations verified per scan" },
            { value: 6, suffix: "s", label: "Average time from photo to verdict" },
            { value: 8, suffix: "×", label: "Labels checked in one batch, one table" },
            { value: 100, suffix: "%", label: "Of checks traceable to a statutory citation" },
          ].map((s, i) => (
            <Reveal key={s.label} delay={i * 0.08}>
              <div className="h-full rounded-2xl border border-border bg-card p-6 shadow-soft">
                <p className="font-display text-5xl text-foreground">
                  <CountUp value={s.value} suffix={s.suffix} />
                </p>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.label}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Feature showcase                                                    */}
      {/* ------------------------------------------------------------------ */}
      <section className="relative overflow-hidden border-y border-border bg-secondary/40 py-20">
        <div
          aria-hidden
          className="bg-grid-paper pointer-events-none absolute inset-0 opacity-40 [mask-image:radial-gradient(70%_60%_at_50%_0%,black,transparent)]"
        />
        <div className="relative mx-auto w-full max-w-6xl px-4 sm:px-6">
          <Reveal>
            <p className="eyebrow text-accent">What ships today</p>
            <h2 className="mt-3 text-4xl sm:text-5xl">From a photo to evidence you can file</h2>
            <p className="mt-3 max-w-2xl text-muted-foreground">
              Not just a verdict on screen. LabelCheck turns each inspection into something an
              officer can batch, print, share and cite.
            </p>
          </Reveal>

          <div className="mt-10 grid gap-5 lg:grid-cols-3">
            {SHOWCASE.map((f, i) => (
              <Reveal key={f.title} delay={i * 0.12} className="h-full">
                <Link
                  to={f.to}
                  search={f.search ?? {}}
                  className="group flex h-full flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-soft transition-all hover:-translate-y-1 hover:shadow-lift"
                >
                  <div className="relative aspect-[4/3] border-b border-border bg-secondary/50">
                    <div
                      aria-hidden
                      className="bg-grid-paper absolute inset-0 opacity-50 [mask-image:radial-gradient(75%_75%_at_50%_45%,black,transparent)]"
                    />
                    <div className="relative h-full">
                      <f.Art />
                    </div>
                  </div>
                  <div className="flex flex-1 flex-col p-6">
                    <p className="eyebrow text-accent">{f.eyebrow}</p>
                    <h3 className="mt-2 text-xl font-semibold">{f.title}</h3>
                    <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
                      {f.body}
                    </p>
                    <span className="mt-5 inline-flex items-center gap-1 text-sm font-medium text-primary">
                      {f.cta}
                      <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* How it works                                                        */}
      {/* ------------------------------------------------------------------ */}
      <section className="py-20">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
          <Reveal>
            <h2 className="text-4xl sm:text-5xl">How it works</h2>
            <p className="mt-3 max-w-2xl text-muted-foreground">
              Three steps, no training required — designed for field inspectors, manufacturers and
              e-commerce compliance teams alike.
            </p>
          </Reveal>

          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {STEPS.map((step, i) => (
              <Reveal key={step.title} delay={i * 0.12}>
                <div className="group h-full rounded-2xl border border-border bg-card p-6 shadow-soft transition-all hover:-translate-y-1 hover:shadow-lift">
                  <div className="flex items-center gap-3">
                    <span className="bg-primary-gradient flex size-11 items-center justify-center rounded-xl text-primary-foreground">
                      <step.icon className="size-5" />
                    </span>
                    <span className="eyebrow text-muted-foreground">Step {i + 1}</span>
                  </div>
                  <h3 className="mt-4 text-lg font-semibold">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.body}</p>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal delay={0.2}>
            <div className="mt-8">
              <Button asChild variant="outline">
                <Link to="/how-it-works">
                  See the full architecture
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Differentiators                                                     */}
      {/* ------------------------------------------------------------------ */}
      <section className="border-t border-border bg-secondary/40 py-20">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
          <Reveal>
            <h2 className="text-4xl sm:text-5xl">Designed to survive scrutiny</h2>
            <p className="mt-3 max-w-2xl text-muted-foreground">
              Compliance tooling is only useful if an inspector can defend its output. Every part of
              LabelCheck is transparent and correctable.
            </p>
          </Reveal>

          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {DIFFERENTIATORS.map((d, i) => (
              <Reveal key={d.title} delay={i * 0.08}>
                <div className="h-full rounded-2xl border border-border bg-card p-6 shadow-soft">
                  <d.icon className="size-6 text-accent" />
                  <h3 className="mt-4 font-semibold">{d.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{d.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* CTA                                                                 */}
      {/* ------------------------------------------------------------------ */}
      <section className="mx-auto w-full max-w-6xl px-4 pb-4 pt-20 sm:px-6">
        <Reveal>
          <div className="bg-primary-gradient relative overflow-hidden rounded-3xl px-6 py-14 text-center shadow-lift sm:px-12">
            <h2 className="text-4xl text-primary-foreground sm:text-4xl">
              Check your first label now
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-primary-foreground/80">
              Sign in with Google or e-mail, then upload one photo, a batch of eight, or run a
              built-in demo label.
            </p>
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <Button asChild size="lg" variant="secondary" className="h-12 px-6">
                <Link to="/scan">
                  <ScanLine className="size-5" /> Scan a Label
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="h-12 border-primary-foreground/40 bg-transparent px-6 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
              >
                <Link to="/pitch">View Our Pitch</Link>
              </Button>
            </div>
          </div>
        </Reveal>
      </section>
    </div>
  );
}
