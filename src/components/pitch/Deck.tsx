import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Check, ChevronLeft, ChevronRight, Maximize2, Minimize2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { DECK, DECK_META, type Block } from "@/lib/deck-content";

/* -------------------------------- blocks --------------------------------- */

function BlockView({ block }: { block: Block }) {
  switch (block.kind) {
    case "lead":
      return (
        <p className="max-w-4xl text-sm leading-relaxed text-muted-foreground sm:text-lg">
          {block.text}
        </p>
      );

    case "note":
      return (
        <div className="relative overflow-hidden rounded-xl border border-border bg-secondary/70 p-3 sm:p-4">
          <span aria-hidden className="absolute inset-y-0 left-0 w-1 bg-accent" />
          <p className="pl-2 text-xs italic leading-relaxed sm:text-sm">{block.text}</p>
        </div>
      );

    case "metrics":
      return (
        <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
          {block.items.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.06 * i, duration: 0.4 }}
              className="overflow-hidden rounded-2xl border border-border bg-card/85 shadow-soft backdrop-blur"
            >
              <div className="h-1 bg-accent" />
              <div className="p-3 sm:p-4">
                <p className="font-display text-2xl text-accent sm:text-4xl">{s.value}</p>
                <p className="mt-1 text-[0.7rem] leading-snug text-muted-foreground sm:text-sm">
                  {s.label}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      );

    case "cards":
      return (
        <div
          className={cn(
            "grid gap-2.5",
            block.cols === 2 && "sm:grid-cols-2",
            block.cols === 3 && "sm:grid-cols-2 lg:grid-cols-3",
            block.cols === 4 && "sm:grid-cols-2 lg:grid-cols-4",
          )}
        >
          {block.items.map((it, i) => (
            <motion.div
              key={it.title}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.04 * i, duration: 0.35 }}
              className="rounded-2xl border border-border bg-card/85 p-3 shadow-soft backdrop-blur sm:p-4"
            >
              {it.badge && (
                <span className="inline-block rounded-full bg-accent/15 px-2 py-0.5 font-mono text-[0.55rem] font-semibold uppercase tracking-wide text-accent sm:text-[0.62rem]">
                  {it.badge}
                </span>
              )}
              <p className="mt-1.5 text-sm font-semibold sm:text-base">{it.title}</p>
              <p className="mt-1 text-[0.7rem] leading-relaxed text-muted-foreground sm:text-[0.8rem]">
                {it.body}
              </p>
            </motion.div>
          ))}
        </div>
      );

    case "pipeline":
      return (
        <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-5">
          {block.items.map((it, i) => (
            <motion.div
              key={it.title}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.07 * i, duration: 0.4 }}
              className="flex flex-col rounded-2xl border border-border bg-card/85 p-3 shadow-soft backdrop-blur"
            >
              <span className="flex size-6 items-center justify-center rounded-full bg-accent text-[0.65rem] font-bold text-accent-foreground">
                {i + 1}
              </span>
              <p className="mt-2 text-sm font-semibold">{it.title}</p>
              <p className="mt-1 flex-1 text-[0.7rem] leading-relaxed text-muted-foreground">
                {it.body}
              </p>
              {it.out && (
                <p className="mt-2 rounded-md bg-accent/10 px-2 py-1 font-mono text-[0.6rem] text-accent">
                  {it.out}
                </p>
              )}
            </motion.div>
          ))}
        </div>
      );

    case "table":
      return (
        <div className="overflow-x-auto rounded-xl border border-border bg-card/85 backdrop-blur">
          <table className="w-full min-w-[36rem] border-collapse text-left">
            <thead>
              <tr className="bg-accent/10">
                {block.head.map((h) => (
                  <th
                    key={h}
                    className="eyebrow px-3 py-2 text-[0.6rem] text-accent sm:px-4 sm:text-[0.68rem]"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, r) => (
                <tr
                  key={r}
                  className={cn(
                    "border-b border-border/60 last:border-b-0",
                    r % 2 && "bg-secondary/40",
                  )}
                >
                  {row.map((c, i) => (
                    <td
                      key={i}
                      className={cn(
                        "px-3 py-2 align-top text-[0.7rem] leading-relaxed sm:px-4 sm:text-[0.8rem]",
                        i === 0 ? "font-semibold" : "text-muted-foreground",
                      )}
                    >
                      {c}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );

    case "compare":
      return (
        <div className="overflow-hidden rounded-xl border border-border bg-card/85 backdrop-blur">
          <div className="grid grid-cols-[1fr_1fr] sm:grid-cols-[0.8fr_1fr_1fr]">
            <div className="hidden sm:block" />
            <div className="px-3 py-1.5 text-[0.58rem] font-semibold uppercase tracking-wide text-muted-foreground sm:px-4">
              {block.head[0]}
            </div>
            <div className="bg-accent/10 px-3 py-1.5 text-[0.58rem] font-semibold uppercase tracking-wide text-accent sm:px-4">
              {block.head[1]}
            </div>
          </div>
          {block.rows.map((r) => (
            <div
              key={r.aspect}
              className="grid grid-cols-[1fr_1fr] border-t border-border sm:grid-cols-[0.8fr_1fr_1fr]"
            >
              <div className="col-span-2 px-3 pt-2 text-[0.72rem] font-semibold sm:col-span-1 sm:px-4 sm:py-2 sm:pt-2">
                {r.aspect}
              </div>
              <div className="flex gap-1.5 px-3 py-2 text-[0.7rem] text-muted-foreground sm:px-4">
                <X className="mt-0.5 size-3 shrink-0 text-destructive" />
                {r.a}
              </div>
              <div className="flex gap-1.5 bg-accent/5 px-3 py-2 text-[0.7rem] sm:px-4">
                <Check className="mt-0.5 size-3 shrink-0 text-success" />
                {r.b}
              </div>
            </div>
          ))}
        </div>
      );

    case "timeline":
      return (
        <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
          {block.items.map((it, i) => (
            <motion.div
              key={it.when}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.07 * i, duration: 0.4 }}
            >
              <p className="eyebrow text-accent">{it.when}</p>
              <div className="relative mt-1.5 mb-2 h-px bg-border">
                <span
                  className={cn(
                    "absolute -top-1 left-0 size-2 rounded-full border border-accent",
                    i === 0 ? "bg-accent" : "bg-background",
                  )}
                />
              </div>
              <div className="rounded-2xl border border-border bg-card/85 p-3 shadow-soft backdrop-blur">
                <p className="text-sm font-semibold">{it.title}</p>
                <p className="mt-1 text-[0.7rem] leading-relaxed text-muted-foreground">
                  {it.body}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      );

    case "bars": {
      const max = Math.max(...block.items.map((i) => i.value));
      return (
        <div>
          {block.caption && <p className="eyebrow mb-2 text-muted-foreground">{block.caption}</p>}
          <div className="space-y-2">
            {block.items.map((it, i) => (
              <div key={it.label} className="flex items-center gap-3">
                <span className="w-32 shrink-0 text-[0.72rem] font-semibold sm:w-44 sm:text-sm">
                  {it.label}
                </span>
                <div className="h-3 flex-1 overflow-hidden rounded-full bg-secondary">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(it.value / max) * 100}%` }}
                    transition={{ delay: 0.1 * i, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                    className={cn(
                      "h-full rounded-full",
                      it.accent ? "bg-accent" : "bg-muted-foreground/50",
                    )}
                  />
                </div>
                <span
                  className={cn(
                    "w-14 shrink-0 text-right text-[0.75rem] font-bold tabular-nums sm:text-sm",
                    it.accent ? "text-accent" : "text-muted-foreground",
                  )}
                >
                  {it.display}
                </span>
              </div>
            ))}
          </div>
        </div>
      );
    }

    case "image":
      return (
        <figure className="flex min-h-0 flex-1 flex-col items-center">
          <img
            src={block.src}
            alt={block.caption ?? ""}
            className="max-h-full min-h-0 flex-1 rounded-xl border border-border object-contain shadow-soft"
          />
          {block.caption && (
            <figcaption className="mt-2 text-center text-[0.68rem] italic text-muted-foreground">
              {block.caption}
            </figcaption>
          )}
        </figure>
      );

    case "gallery":
      return (
        <div className="grid min-h-0 flex-1 gap-3 sm:grid-cols-3">
          {block.items.map((g) => (
            <figure key={g.src} className="flex min-h-0 flex-col">
              <img
                src={g.src}
                alt={g.caption}
                className="min-h-0 flex-1 rounded-xl border border-border object-contain shadow-soft"
              />
              <figcaption className="mt-1.5 text-center text-[0.66rem] font-medium">
                {g.caption}
              </figcaption>
            </figure>
          ))}
        </div>
      );

    case "split":
      return (
        <div className="grid min-h-0 flex-1 items-start gap-4 sm:grid-cols-2">
          <img
            src={block.src}
            alt=""
            className="max-h-full rounded-xl border border-border object-contain shadow-soft"
          />
          <div className="space-y-2">
            {block.items.map((it, i) => (
              <motion.div
                key={it.title}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.05 * i, duration: 0.35 }}
                className="flex gap-2"
              >
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-accent" />
                <div>
                  <p className="text-[0.8rem] font-semibold sm:text-sm">{it.title}</p>
                  <p className="text-[0.68rem] leading-relaxed text-muted-foreground sm:text-[0.78rem]">
                    {it.body}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      );
  }
}

/* --------------------------------- deck ---------------------------------- */

export function Deck({ fullscreenRef }: { fullscreenRef?: { current: (() => void) | null } }) {
  const [index, setIndex] = useState(0);
  const [dir, setDir] = useState(1);
  const [isFs, setIsFs] = useState(false);
  const shellRef = useRef<HTMLDivElement>(null);

  const go = useCallback(
    (next: number) => {
      setDir(next > index ? 1 : -1);
      setIndex(Math.max(0, Math.min(DECK.length - 1, next)));
    },
    [index],
  );

  const toggleFullscreen = useCallback(() => {
    const el = shellRef.current;
    if (!el) return;
    if (document.fullscreenElement) void document.exitFullscreen();
    else void el.requestFullscreen?.();
  }, []);

  useEffect(() => {
    if (fullscreenRef) fullscreenRef.current = toggleFullscreen;
  }, [fullscreenRef, toggleFullscreen]);

  useEffect(() => {
    const onFs = () => setIsFs(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " ") go(index + 1);
      if (e.key === "ArrowLeft") go(index - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, index]);

  const slide = DECK[index]!;

  return (
    <div className="space-y-3">
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
          <div
            aria-hidden
            className="bg-grid-paper pointer-events-none absolute inset-0 opacity-[0.3]"
          />
          <span aria-hidden className="absolute inset-y-0 left-0 w-1 bg-accent" />

          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={slide.id}
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
              <div className="flex min-h-full flex-col gap-3 px-6 py-6 sm:gap-4 sm:px-12 sm:py-9">
                <p className="eyebrow text-accent">
                  {slide.no ? `${slide.no} · ` : ""}
                  {slide.kicker}
                </p>
                <h2 className="max-w-5xl text-xl leading-[1.1] sm:text-4xl">{slide.title}</h2>
                {slide.blocks.map((b, i) => (
                  <BlockView key={i} block={b} />
                ))}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* controls */}
        <div className="relative flex items-center justify-between gap-3 border-t border-border bg-card/90 px-4 py-3 backdrop-blur">
          <div className="hidden gap-1.5 sm:flex">
            {DECK.map((s, i) => (
              <button
                key={s.id}
                aria-label={`Go to slide ${i + 1}: ${s.kicker}`}
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
              {index + 1} / {DECK.length}
            </span>
            <Button
              size="sm"
              variant="outline"
              onClick={() => go(index - 1)}
              disabled={index === 0}
            >
              <ChevronLeft className="size-4" /> Prev
            </Button>
            <Button size="sm" onClick={() => go(index + 1)} disabled={index === DECK.length - 1}>
              Next <ChevronRight className="size-4" />
            </Button>
            <Button size="sm" variant="ghost" onClick={toggleFullscreen}>
              {isFs ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}
            </Button>
          </div>
        </div>
      </div>
      <p className="text-center text-xs text-muted-foreground">
        {DECK.length} slides · use ← → arrow keys, swipe, or the buttons. Speaker notes ship inside
        the PPTX. {DECK_META.problemId}
      </p>
    </div>
  );
}

export { DECK as SLIDES };
