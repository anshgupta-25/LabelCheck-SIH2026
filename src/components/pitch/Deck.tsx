import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  ArrowRight,
  Camera,
  ChevronLeft,
  ChevronRight,
  Cpu,
  Database,
  Eye,
  FileCheck2,
  Gauge,
  Languages,
  Layers,
  Maximize2,
  Minimize2,
  PencilLine,
  Rocket,
  ScanLine,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/* ---------------------------------- bits --------------------------------- */

function Kicker({ children }: { children: ReactNode }) {
  return <p className="eyebrow text-accent">{children}</p>;
}

function Card({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border bg-card/80 p-4 shadow-soft backdrop-blur sm:p-5",
        className,
      )}
    >
      {children}
    </div>
  );
}

function Slide({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-full w-full flex-col justify-center px-6 py-8 sm:px-12 sm:py-12">
      {children}
    </div>
  );
}

/* --------------------------------- slides -------------------------------- */

function SlideTitle() {
  return (
    <Slide>
      <div className="bg-grid-paper pointer-events-none absolute inset-0 opacity-[0.35]" />
      <div className="relative">
        <Kicker>Smart India Hackathon 2026</Kicker>
        <h2 className="mt-3 max-w-4xl text-3xl leading-[1.05] sm:text-5xl lg:text-6xl">
          LabelCheck — <span className="text-gradient">AI-Powered</span> Legal Metrology Compliance
          Scanner
        </h2>
        <p className="mt-4 text-base text-muted-foreground sm:text-xl">
          Scan a label. Verify compliance in seconds.
        </p>
        <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-border bg-secondary px-4 py-1.5 text-xs font-medium sm:text-sm">
          <ShieldCheck className="size-4 text-accent" />
          SIH26034 · Ministry of Consumer Affairs
        </div>
        <div className="mt-7 border-t border-border pt-5">
          <p className="eyebrow text-muted-foreground">Team CodeCatalysts</p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-accent/40 bg-accent/10 px-3 py-1 text-xs font-medium text-accent sm:text-sm">
              Team Leader · Ansh Gupta (12402677)
            </span>
            {[
              "Dasari Aarya Nandan",
              "Archi Data",
              "Akshaj Kumar",
              "Bhumi Dwivedi",
              "Eshan Thakur",
            ].map((n) => (
              <span
                key={n}
                className="rounded-full border border-border bg-card px-3 py-1 text-xs sm:text-sm"
              >
                {n}
              </span>
            ))}
          </div>
        </div>
      </div>
    </Slide>
  );
}

function SlideProblem() {
  return (
    <Slide>
      <Kicker>01 · The Problem</Kicker>
      <h2 className="mt-2 text-2xl sm:text-4xl">Compliance is checked one package at a time</h2>
      <div className="mt-5 grid gap-4 sm:grid-cols-3">
        <Card>
          <Layers className="size-5 text-accent" />
          <p className="mt-3 text-3xl font-semibold sm:text-4xl">7</p>
          <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
            mandatory declarations required on every packaged product under the Legal Metrology
            (Packaged Commodities) Rules, 2011 — MRP, net quantity, manufacture date, manufacturer
            details and more.
          </p>
        </Card>
        <Card>
          <Eye className="size-5 text-accent" />
          <p className="mt-3 text-3xl font-semibold sm:text-4xl">Widespread</p>
          <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
            Missing or misleading declarations are common — consumers cannot verify what they are
            paying for.
          </p>
        </Card>
        <Card>
          <Gauge className="size-5 text-accent" />
          <p className="mt-3 text-3xl font-semibold sm:text-4xl">~1/min</p>
          <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
            Enforcement is manual. Officers inspect packages individually — impossible to scale
            across crores of products and exploding e-commerce listings.
          </p>
        </Card>
      </div>
    </Slide>
  );
}

function SlideSolution() {
  const steps = [
    { icon: Camera, t: "Photo", d: "Capture the principal display panel on any phone." },
    { icon: Cpu, t: "AI Analysis", d: "OCR extracts text; the rule engine checks each field." },
    {
      icon: FileCheck2,
      t: "Compliance Report",
      d: "Missing fields flagged with the exact rule cited.",
    },
  ];
  return (
    <Slide>
      <Kicker>02 · Our Solution</Kicker>
      <h2 className="mt-2 text-2xl sm:text-4xl">
        Photograph a label, get an instant compliance report
      </h2>
      <div className="mt-5 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
        {steps.map((s, i) => (
          <div key={s.t} className="flex flex-1 items-center gap-3">
            <Card className="flex-1">
              <s.icon className="size-5 text-accent" />
              <p className="mt-2 font-semibold">{s.t}</p>
              <p className="mt-1 text-xs text-muted-foreground sm:text-sm">{s.d}</p>
            </Card>
            {i < steps.length - 1 && (
              <ArrowRight className="hidden size-5 shrink-0 text-accent sm:block" />
            )}
          </div>
        ))}
      </div>
      <div className="mt-5 grid gap-2 sm:grid-cols-4">
        {[
          { icon: Gauge, t: "Per-field confidence" },
          { icon: PencilLine, t: "Editable OCR text" },
          { icon: Languages, t: "Multilingual labels" },
          { icon: Layers, t: "Batch scanning" },
        ].map((x) => (
          <div
            key={x.t}
            className="flex items-center gap-2 rounded-xl border border-border bg-secondary/60 px-3 py-2 text-xs sm:text-sm"
          >
            <x.icon className="size-4 text-accent" /> {x.t}
          </div>
        ))}
      </div>
    </Slide>
  );
}

function SlideArchitecture() {
  const flow = [
    "Image Upload",
    "OCR Engine",
    "Text Extraction",
    "Rule Engine",
    "Compliance Report",
    "Audit Database",
  ];
  return (
    <Slide>
      <Kicker>03 · Technical Architecture</Kicker>
      <h2 className="mt-2 text-2xl sm:text-4xl">A simple, auditable pipeline</h2>
      <div className="mt-5 flex flex-wrap items-center gap-2">
        {flow.map((f, i) => (
          <div key={f} className="flex items-center gap-2">
            <span className="rounded-xl border border-border bg-card px-3 py-2 font-mono text-[11px] shadow-soft sm:text-xs">
              {f}
            </span>
            {i < flow.length - 1 && <ChevronRight className="size-4 text-accent" />}
          </div>
        ))}
      </div>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Card>
          <p className="eyebrow text-muted-foreground">Stack</p>
          <ul className="mt-3 space-y-2 text-xs text-muted-foreground sm:text-sm">
            <li>React 19 + TanStack Start (SSR) front end</li>
            <li>Supabase — Postgres audit log &amp; private image storage</li>
            <li>Gemini vision model for text extraction, key held server-side</li>
            <li>Modular regex rule engine (Rule 6)</li>
          </ul>
        </Card>
        <Card>
          <p className="eyebrow text-muted-foreground">Scales by design</p>
          <ul className="mt-3 space-y-2 text-xs text-muted-foreground sm:text-sm">
            <li>
              <Database className="mr-1 inline size-4 text-accent" />
              Cloud-native storage &amp; audit trail
            </li>
            <li>
              <Layers className="mr-1 inline size-4 text-accent" />
              Pluggable rules — new regulations drop in as modules
            </li>
            <li>
              <ScanLine className="mr-1 inline size-4 text-accent" />
              Stateless scanning, horizontally scalable
            </li>
          </ul>
        </Card>
      </div>
    </Slide>
  );
}

function SlideFeasibility() {
  return (
    <Slide>
      <Kicker>04 · Feasibility &amp; Innovation</Kicker>
      <h2 className="mt-2 text-2xl sm:text-4xl">Proven tech, working prototype</h2>
      <div className="mt-5 grid gap-4 sm:grid-cols-3">
        <Card>
          <ShieldCheck className="size-5 text-accent" />
          <p className="mt-2 font-semibold">Built on accessible tech</p>
          <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
            No exotic hardware — a working prototype is already live and scanning labels today.
          </p>
        </Card>
        <Card>
          <PencilLine className="size-5 text-accent" />
          <p className="mt-2 font-semibold">Handles real-world messiness</p>
          <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
            Confidence scores and editable fields absorb OCR imperfections; a language selector
            covers multilingual packs.
          </p>
        </Card>
        <Card>
          <Sparkles className="size-5 text-accent" />
          <p className="mt-2 font-semibold">The innovation</p>
          <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
            First tool to combine OCR, a codified Legal Metrology rule engine and an
            officer-friendly verification workflow — transparent and auditable end to end.
          </p>
        </Card>
      </div>
    </Slide>
  );
}

function SlideImpact() {
  return (
    <Slide>
      <Kicker>05 · Impact</Kicker>
      <h2 className="mt-2 text-2xl sm:text-4xl">From one per minute to seconds</h2>
      <div className="mt-5 grid gap-4 sm:grid-cols-3">
        {[
          {
            icon: Users,
            t: "Legal Metrology officers",
            d: "Scalable, evidence-backed enforcement.",
          },
          {
            icon: ShoppingCart,
            t: "E-commerce platforms",
            d: "Pre-listing compliance checks at scale.",
          },
          { icon: Eye, t: "Consumers", d: "Self-verify any pack before buying." },
        ].map((x) => (
          <Card key={x.t}>
            <x.icon className="size-5 text-accent" />
            <p className="mt-2 font-semibold">{x.t}</p>
            <p className="mt-1 text-xs text-muted-foreground sm:text-sm">{x.d}</p>
          </Card>
        ))}
      </div>
      <div className="mt-5 flex flex-wrap items-center gap-2">
        <span className="eyebrow flex items-center gap-1 text-muted-foreground">
          <Rocket className="size-4 text-accent" /> Roadmap
        </span>
        {[
          "Regional languages",
          "Bulk e-commerce scanning",
          "Mobile inspector app",
          "Govt system integration",
        ].map((r) => (
          <span
            key={r}
            className="rounded-full border border-border bg-secondary px-3 py-1 text-xs sm:text-sm"
          >
            {r}
          </span>
        ))}
      </div>
      <p className="mt-6 font-display text-xl sm:text-2xl">CodeCatalysts · SIH 2026.</p>
    </Slide>
  );
}

const SLIDES = [
  { id: "title", node: <SlideTitle /> },
  { id: "problem", node: <SlideProblem /> },
  { id: "solution", node: <SlideSolution /> },
  { id: "architecture", node: <SlideArchitecture /> },
  { id: "feasibility", node: <SlideFeasibility /> },
  { id: "impact", node: <SlideImpact /> },
];

/* ---------------------------------- deck --------------------------------- */

export function Deck({ fullscreenRef }: { fullscreenRef?: { current: (() => void) | null } }) {
  const [index, setIndex] = useState(0);
  const [dir, setDir] = useState(1);
  const [isFs, setIsFs] = useState(false);
  const shellRef = useRef<HTMLDivElement>(null);

  const go = useCallback((next: number) => {
    setIndex((cur) => {
      const clamped = Math.max(0, Math.min(SLIDES.length - 1, next));
      setDir(clamped >= cur ? 1 : -1);
      return clamped;
    });
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " ") go(index + 1);
      if (e.key === "ArrowLeft") go(index - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, go]);

  useEffect(() => {
    const onFs = () => setIsFs(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void shellRef.current?.requestFullscreen?.();
  }, []);

  useEffect(() => {
    if (fullscreenRef) fullscreenRef.current = toggleFullscreen;
  }, [fullscreenRef, toggleFullscreen]);

  return (
    <div className="space-y-4">
      <div
        ref={shellRef}
        className={cn(
          "relative overflow-hidden rounded-3xl border border-border bg-card shadow-lift",
          isFs && "flex h-screen flex-col justify-center rounded-none",
        )}
      >
        <div
          className={cn("relative w-full", isFs && "flex-1")}
          style={isFs ? undefined : { aspectRatio: "16 / 9", minHeight: 380 }}
        >
          <div className="bg-hero-gradient absolute inset-0" />
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={SLIDES[index]!.id}
              initial={{ opacity: 0, x: dir * 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: dir * -40 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.15}
              onDragEnd={(_, info) => {
                if (info.offset.x < -80) go(index + 1);
                else if (info.offset.x > 80) go(index - 1);
              }}
              className="absolute inset-0 overflow-y-auto"
            >
              {SLIDES[index]!.node}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* controls */}
        <div className="relative flex items-center justify-between gap-3 border-t border-border bg-card/90 px-4 py-3 backdrop-blur">
          <div className="flex gap-1.5">
            {SLIDES.map((s, i) => (
              <button
                key={s.id}
                aria-label={`Go to slide ${i + 1}`}
                onClick={() => go(i)}
                className={cn(
                  "h-1.5 rounded-full transition-all",
                  i === index ? "w-7 bg-accent" : "w-3 bg-border hover:bg-muted-foreground/40",
                )}
              />
            ))}
          </div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-muted-foreground tabular-nums">
              {index + 1} / {SLIDES.length}
            </span>
            <Button
              size="sm"
              variant="outline"
              onClick={() => go(index - 1)}
              disabled={index === 0}
            >
              <ChevronLeft className="size-4" /> Prev
            </Button>
            <Button size="sm" onClick={() => go(index + 1)} disabled={index === SLIDES.length - 1}>
              Next <ChevronRight className="size-4" />
            </Button>
            <Button size="sm" variant="ghost" onClick={toggleFullscreen}>
              {isFs ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}
            </Button>
          </div>
        </div>
      </div>
      <p className="text-center text-xs text-muted-foreground">
        Use ← → arrow keys, swipe, or the buttons to navigate.
      </p>
    </div>
  );
}

export { SLIDES };
