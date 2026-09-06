import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import {
  ScanLine,
  Presentation,
  Camera,
  Cpu,
  FileCheck2,
  ArrowRight,
  ArrowDown,
  Languages,
  Eye,
  PencilLine,
  Database,
  Layers,
  FileDown,
  QrCode,
  Check,
  X,
  Landmark,
  Factory,
  Store,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Reveal, CountUp } from "@/components/site/Reveal";
import { WireGlobe } from "@/components/site/WireGlobe";
import { BatchArt, ReportArt, ShareArt } from "@/components/site/FeatureArt";
import { GlowCard, IconTile } from "@/components/site/GlowCard";
import { Objections } from "@/components/site/Objections";
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

/**
 * The manual status quo versus this tool. Every row is a claim we can defend on
 * stage: the six-second figure is a measured OCR round-trip, not a guess.
 */
const COMPARISON = [
  {
    aspect: "Time per pack",
    manual: "About a minute, by eye",
    ours: "About six seconds, end to end",
  },
  {
    aspect: "Consistency",
    manual: "Varies by officer, and by hour",
    ours: "The same seven checks, every time",
  },
  {
    aspect: "Legal citation",
    manual: "Recalled from memory",
    ours: "Sub-rule printed against each finding",
  },
  {
    aspect: "Audit trail",
    manual: "A paper note, if any",
    ours: "Timestamped record, PDF and share link",
  },
  {
    aspect: "Scale",
    manual: "One pack at a time",
    ours: "Eight per batch; an API for a catalogue",
  },
];

const SHOWCASE = [
  {
    eyebrow: "Batch check",
    title: "Eight labels, one table of verdicts",
    body: "Drop a whole shelf of photos at once. Each label is scanned in turn and stamped compliant or not, with the missing declarations listed — the pre-listing check an e-commerce catalogue team needs.",
    cta: "Try a batch",
    to: "/scan" as const,
    params: undefined,
    search: undefined,
    Art: BatchArt,
  },
  {
    eyebrow: "PDF evidence",
    title: "An officer-ready report in one click",
    body: "Every verdict exports to a cited PDF: the declarations table, the violations with their sub-rules, the label photo and the raw extracted text — ready to attach to an inspection file.",
    cta: "See a sample report",
    to: "/report/$id" as const,
    params: { id: "demo-non-compliant" },
    search: undefined,
    Art: ReportArt,
  },
  {
    eyebrow: "Share link + QR",
    title: "A permanent link to the live verdict",
    body: "Each report has its own URL and a QR code printed on the PDF. Scan it from the pack, the file or a colleague's phone and the current verdict opens instantly.",
    cta: "Browse past reports",
    to: "/history" as const,
    params: undefined,
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

const AUDIENCES = [
  {
    icon: Landmark,
    who: "Legal Metrology officers",
    body: "Check a pack in the field from a phone, cite the sub-rule on the spot, and walk away with a signed-off PDF for the inspection file.",
  },
  {
    icon: Factory,
    who: "Manufacturers & packers",
    body: "Catch a missing declaration on the artwork proof rather than after a print run of a hundred thousand cartons.",
  },
  {
    icon: Store,
    who: "E-commerce marketplaces",
    body: "Pre-screen listing images before a product goes live, so non-compliant packaging never reaches the storefront.",
  },
];

const TEAM = {
  name: "CodeCatalysts",
  leader: "Ansh Gupta",
  members: ["Dasari Aarya Nandan", "Archi Data", "Akshaj Kumar", "Bhumi Dwivedi", "Eshan Thakur"],
};

function initials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((p) => p[0])
    .join("");
}

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

        <div className="relative mx-auto grid w-full max-w-6xl items-center gap-8 px-4 pb-14 pt-8 sm:px-6 sm:pb-20 sm:pt-12 lg:grid-cols-[0.95fr_1.05fr]">
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
                <Link to="/report/$id" params={{ id: "demo-compliant" }}>
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

        {/* scroll cue — tells a judge there is more, and where it starts */}
        <motion.a
          href="#problem"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.1, duration: 0.6 }}
          className="relative mx-auto mb-8 hidden w-fit items-center gap-2 text-xs text-muted-foreground transition-colors hover:text-accent lg:flex"
        >
          Why it matters
          <motion.span
            animate={{ y: [0, 4, 0] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
          >
            <ArrowDown className="size-4" />
          </motion.span>
        </motion.a>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* The problem — status quo vs LabelCheck                              */}
      {/* ------------------------------------------------------------------ */}
      <section id="problem" className="scroll-mt-20 py-16">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
          <Reveal>
            <p className="eyebrow text-accent">The problem</p>
            <h2 className="mt-3 max-w-3xl text-4xl sm:text-5xl">
              Seven declarations. Crores of packages. Verified by eye.
            </h2>
            <p className="mt-4 max-w-2xl leading-relaxed text-muted-foreground">
              Every pre-packaged commodity sold in India must carry seven mandatory declarations
              under Rule 6. Today an officer checks them one pack at a time, from memory, at roughly
              a pack a minute — and an entire e-commerce catalogue is effectively unchecked. The
              rules are not the bottleneck; the reading of them is.
            </p>
          </Reveal>

          <Reveal delay={0.12}>
            <div className="mt-10 overflow-hidden rounded-3xl border border-border bg-card shadow-soft">
              <div className="grid grid-cols-[1fr_1fr] border-b border-border bg-secondary/60 sm:grid-cols-[1.1fr_1fr_1fr]">
                <div className="hidden px-6 py-4 sm:block" />
                <div className="px-5 py-4 sm:px-6">
                  <p className="eyebrow text-muted-foreground">Manual inspection</p>
                </div>
                <div className="border-l border-border bg-accent/5 px-5 py-4 sm:px-6">
                  <p className="eyebrow text-accent">With LabelCheck</p>
                </div>
              </div>

              {COMPARISON.map((row, i) => (
                <motion.div
                  key={row.aspect}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ duration: 0.45, delay: i * 0.07, ease: [0.22, 1, 0.36, 1] }}
                  className="grid grid-cols-[1fr_1fr] border-b border-border last:border-b-0 sm:grid-cols-[1.1fr_1fr_1fr]"
                >
                  <div className="col-span-2 px-5 pt-4 text-sm font-semibold sm:col-span-1 sm:px-6 sm:py-5 sm:pt-5">
                    {row.aspect}
                  </div>
                  <div className="flex items-start gap-2.5 px-5 py-4 text-sm text-muted-foreground sm:px-6 sm:py-5">
                    <X className="mt-0.5 size-4 shrink-0 text-destructive" />
                    {row.manual}
                  </div>
                  <div className="flex items-start gap-2.5 border-l border-border bg-accent/5 px-5 py-4 text-sm sm:px-6 sm:py-5">
                    <Check className="mt-0.5 size-4 shrink-0 text-success" />
                    {row.ours}
                  </div>
                </motion.div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Impact stats                                                        */}
      {/* ------------------------------------------------------------------ */}
      <section className="mx-auto w-full max-w-6xl px-4 pb-16 sm:px-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { value: 7, suffix: "", label: "Mandatory declarations verified per scan" },
            { value: 6, suffix: "s", label: "Average time from photo to verdict" },
            { value: 8, suffix: "×", label: "Labels checked in one batch, one table" },
            { value: 100, suffix: "%", label: "Of checks traceable to a statutory citation" },
          ].map((s, i) => (
            <GlowCard key={s.label} delay={i * 0.08} spotlight={180}>
              <div className="p-6">
                <p className="font-display text-5xl text-foreground">
                  <CountUp value={s.value} suffix={s.suffix} />
                </p>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.label}</p>
              </div>
            </GlowCard>
          ))}
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* The seven declarations — the legal spine, straight from the engine   */}
      {/* ------------------------------------------------------------------ */}
      <section className="relative overflow-hidden border-y border-border bg-secondary/40 py-16">
        <div
          aria-hidden
          className="bg-grid-paper pointer-events-none absolute inset-0 opacity-40 [mask-image:radial-gradient(70%_60%_at_50%_0%,black,transparent)]"
        />
        <div className="relative mx-auto w-full max-w-6xl px-4 sm:px-6">
          <Reveal>
            <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
              <div className="max-w-2xl">
                <p className="eyebrow text-accent">The legal spine</p>
                <h2 className="mt-3 text-4xl sm:text-5xl">Seven checks, seven sub-rules.</h2>
                <p className="mt-3 leading-relaxed text-muted-foreground">
                  Not features we invented. Each is a clause of Rule 6(1) of the Legal Metrology
                  (Packaged Commodities) Rules, 2011 — and this list renders straight from the
                  engine that runs the checks, so the page can never drift from the code.
                </p>
              </div>
              <Button asChild variant="outline" className="bg-card/70">
                <Link to="/how-it-works">
                  How each rule is detected
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
            </div>
          </Reveal>

          <ol className="mt-8 grid gap-3 md:grid-cols-2">
            {RULES.map((r, i) => (
              <li key={r.key} className={i === RULES.length - 1 ? "md:col-span-2" : undefined}>
                <GlowCard delay={i * 0.05} spotlight={260}>
                  <div className="p-5">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-primary text-[11px] font-semibold text-primary-foreground">
                        {i + 1}
                      </span>
                      <span className="font-mono text-[0.7rem] text-accent">{r.ruleRef}</span>
                      <span className="rounded-full border border-border bg-secondary px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                        {r.critical ? "Verdict-critical" : "Reported · imports only"}
                      </span>
                    </div>
                    <h3 className="mt-2.5 font-semibold">{r.label}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                      {r.requirement}
                    </p>
                  </div>
                </GlowCard>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Feature showcase                                                    */}
      {/* ------------------------------------------------------------------ */}
      <section className="relative overflow-hidden border-b border-border py-16">
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
                  params={f.params ?? {}}
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
      <section className="py-16">
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
              <GlowCard key={step.title} delay={i * 0.12}>
                <div className="p-6">
                  <div className="flex items-center gap-3">
                    <IconTile icon={step.icon} size="sm" />
                    <span className="eyebrow text-muted-foreground">Step {i + 1}</span>
                  </div>
                  <h3 className="mt-4 text-lg font-semibold">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.body}</p>
                </div>
              </GlowCard>
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
      <section className="border-t border-border bg-secondary/40 py-16">
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
              <GlowCard key={d.title} delay={i * 0.08} spotlight={200}>
                <div className="p-6">
                  <IconTile icon={d.icon} size="sm" />
                  <h3 className="mt-4 font-semibold">{d.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{d.body}</p>
                </div>
              </GlowCard>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Who it's for                                                        */}
      {/* ------------------------------------------------------------------ */}
      <section className="border-t border-border py-16">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
          <Reveal>
            <p className="eyebrow text-accent">Who it is for</p>
            <h2 className="mt-3 text-4xl sm:text-5xl">Three sides of the same rule</h2>
            <p className="mt-3 max-w-2xl text-muted-foreground">
              Rule 6 binds whoever packs, lists or inspects the commodity. The same engine serves
              all three, from the same photograph.
            </p>
          </Reveal>

          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {AUDIENCES.map((a, i) => (
              <GlowCard key={a.who} delay={i * 0.1} className="rounded-3xl">
                <div className="p-7">
                  <IconTile icon={a.icon} />
                  <h3 className="mt-5 text-xl font-semibold">{a.who}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{a.body}</p>
                </div>
              </GlowCard>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Objections — the questions judges actually ask                      */}
      {/* ------------------------------------------------------------------ */}
      <section className="border-t border-border bg-secondary/40 py-16">
        <div className="mx-auto w-full max-w-5xl px-4 sm:px-6">
          <Reveal>
            <p className="eyebrow text-accent">Ask us anything</p>
            <h2 className="mt-3 text-4xl sm:text-5xl">The hard questions, answered here</h2>
            <p className="mt-3 max-w-2xl text-muted-foreground">
              Including the one we cannot solve. We would rather name a limit than talk around it.
            </p>
          </Reveal>
          <Reveal delay={0.1}>
            <Objections />
          </Reveal>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Team                                                                */}
      {/* ------------------------------------------------------------------ */}
      <section className="border-t border-border py-16">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
          <Reveal>
            <p className="eyebrow text-accent">Built by</p>
            <h2 className="mt-3 text-4xl sm:text-5xl">Team {TEAM.name}</h2>
            <p className="mt-3 max-w-2xl text-muted-foreground">
              Smart India Hackathon 2026 · Problem statement SIH26034 · Ministry of Consumer
              Affairs, Food &amp; Public Distribution.
            </p>
          </Reveal>

          <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[{ name: TEAM.leader, role: "Team Leader" }]
              .concat(TEAM.members.map((name) => ({ name, role: "Member" })))
              .map((m, i) => (
                <GlowCard key={m.name} delay={i * 0.06} spotlight={160}>
                  <div className="flex items-center gap-4 p-4">
                    <span className="bg-primary-gradient flex size-11 shrink-0 items-center justify-center rounded-xl font-mono text-sm text-primary-foreground transition-transform duration-300 group-hover:scale-110">
                      {initials(m.name)}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{m.name}</p>
                      <p className="text-xs text-muted-foreground">{m.role}</p>
                    </div>
                  </div>
                </GlowCard>
              ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* CTA                                                                 */}
      {/* ------------------------------------------------------------------ */}
      <section className="mx-auto w-full max-w-6xl px-4 pb-4 sm:px-6">
        <Reveal>
          <div className="bg-primary-gradient relative overflow-hidden rounded-3xl px-6 py-14 text-center shadow-lift sm:px-12">
            <div
              aria-hidden
              className="bg-grid-paper pointer-events-none absolute inset-0 opacity-20 [mask-image:radial-gradient(70%_70%_at_50%_50%,black,transparent)]"
            />
            <h2 className="relative text-4xl text-primary-foreground sm:text-4xl">
              Check your first label now
            </h2>
            <p className="relative mx-auto mt-3 max-w-xl text-primary-foreground/80">
              Sign in with Google or e-mail, then upload one photo, a batch of eight, or run a
              built-in demo label.
            </p>
            <div className="relative mt-7 flex flex-wrap justify-center gap-3">
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
