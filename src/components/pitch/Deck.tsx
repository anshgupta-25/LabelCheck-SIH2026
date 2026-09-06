import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ChevronLeft, ChevronRight, Maximize2, Minimize2 } from "lucide-react";
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

    case "stats":
      return (
        <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
          {block.items.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.06 * i, duration: 0.4 }}
              className="rounded-2xl border border-border bg-card/80 p-3 shadow-soft backdrop-blur sm:p-4"
            >
              <p className="font-display text-2xl text-accent sm:text-4xl">{s.value}</p>
              <p className="mt-1 text-[0.7rem] leading-snug text-muted-foreground sm:text-sm">
                {s.label}
              </p>
            </motion.div>
          ))}
        </div>
      );

    case "bullets":
    case "steps":
      return (
        <div
          className={cn(
            "grid gap-2.5",
            block.items.length > 3 ? "sm:grid-cols-2" : "sm:grid-cols-1",
          )}
        >
          {block.items.map((it, i) => (
            <motion.div
              key={it.title}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.05 * i, duration: 0.4 }}
              className="flex gap-2.5"
            >
              <span className="mt-1.5 size-2 shrink-0 rounded-full bg-accent" />
              <div className="min-w-0">
                <p className="text-sm font-semibold sm:text-base">
                  {block.kind === "steps" && (
                    <span className="mr-2 font-mono text-[0.65rem] text-accent">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                  )}
                  {it.title}
                </p>
                <p className="mt-0.5 text-[0.72rem] leading-relaxed text-muted-foreground sm:text-sm">
                  {it.body}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      );

    case "table":
      return (
        <div className="overflow-x-auto rounded-xl border border-border bg-card/80 backdrop-blur">
          <table className="w-full min-w-[36rem] border-collapse text-left">
            <thead>
              <tr className="border-b border-border">
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
                <tr key={r} className="border-b border-border/60 last:border-b-0">
                  {row.map((c, i) => (
                    <td
                      key={i}
                      className={cn(
                        "px-3 py-2 align-top text-[0.72rem] leading-relaxed sm:px-4 sm:text-sm",
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
