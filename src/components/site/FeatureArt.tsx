/**
 * Animated illustrations for the landing page feature showcase.
 * Pure CSS + motion, no images; every colour is a design token so the art
 * follows the theme. Honour prefers-reduced-motion by settling on the final
 * frame instead of looping.
 */
import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Check, X, FileDown, Link2, Copy } from "lucide-react";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* Batch: eight label tiles get scanned and stamped one by one         */
/* ------------------------------------------------------------------ */

const BATCH_VERDICTS = [true, false, true, true, false, true, true, false];

export function BatchArt() {
  const reduce = useReducedMotion();
  const [step, setStep] = useState(reduce ? BATCH_VERDICTS.length : 0);

  useEffect(() => {
    if (reduce) return;
    const id = setInterval(() => setStep((s) => (s + 1) % (BATCH_VERDICTS.length + 3)), 620);
    return () => clearInterval(id);
  }, [reduce]);

  const done = Math.min(step, BATCH_VERDICTS.length);
  const bad = BATCH_VERDICTS.slice(0, done).filter((ok) => !ok).length;

  return (
    <div className="relative h-full w-full p-5 pb-8">
      <div className="grid h-full grid-cols-4 gap-2.5">
        {BATCH_VERDICTS.map((ok, i) => {
          const state = step > i ? "done" : step === i ? "scanning" : "idle";
          return (
            <div
              key={i}
              className={cn(
                "relative overflow-hidden rounded-xl border bg-background transition-colors duration-300",
                state === "idle"
                  ? "border-border"
                  : ok
                    ? "border-success/50"
                    : "border-destructive/50",
              )}
            >
              {/* faux label content */}
              <div className="absolute inset-x-2 top-2 h-1.5 rounded-full bg-foreground/15" />
              <div className="absolute left-2 top-[18px] h-1 w-2/3 rounded-full bg-foreground/10" />
              <div className="absolute left-2 right-3 top-[26px] h-1 rounded-full bg-foreground/10" />
              <div className="absolute left-2 top-[34px] h-1 w-1/2 rounded-full bg-foreground/10" />
              <div className="absolute inset-x-2 bottom-2 h-3 rounded-md bg-accent/20" />

              {state === "scanning" && (
                <motion.div
                  className="absolute inset-x-0 h-0.5 bg-primary shadow-[0_0_10px_2px_var(--color-primary)]"
                  initial={{ top: "6%" }}
                  animate={{ top: "94%" }}
                  transition={{ duration: 0.6, ease: "linear" }}
                />
              )}

              <AnimatePresence>
                {state === "done" && (
                  <motion.span
                    initial={{ scale: 0, rotate: -25 }}
                    animate={{ scale: 1, rotate: 0 }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 340, damping: 16 }}
                    className={cn(
                      "absolute right-1.5 top-1.5 flex size-5 items-center justify-center rounded-full text-primary-foreground shadow-soft",
                      ok ? "bg-success" : "bg-destructive",
                    )}
                  >
                    {ok ? <Check className="size-3" /> : <X className="size-3" />}
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      {/* running tally */}
      <motion.div
        className="absolute inset-x-0 -bottom-0.5 mx-auto w-max rounded-full border border-border bg-card px-3 py-1 font-mono text-[10px] font-semibold shadow-lift"
        animate={{ opacity: done > 0 ? 1 : 0, y: done > 0 ? 0 : 6 }}
        transition={{ duration: 0.3 }}
      >
        {done}/{BATCH_VERDICTS.length} checked ·{" "}
        <span className={bad ? "text-destructive" : "text-success"}>{bad} non-compliant</span>
      </motion.div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* QR pattern: deterministic, drawn from tokens                        */
/* ------------------------------------------------------------------ */

function useQrPattern(n: number) {
  return useMemo(() => {
    const cells: boolean[] = [];
    const finder = (x: number, y: number) => {
      const inBox = (ox: number, oy: number) => x >= ox && x < ox + 7 && y >= oy && y < oy + 7;
      const ring = (ox: number, oy: number) => {
        const dx = x - ox;
        const dy = y - oy;
        const edge = dx === 0 || dy === 0 || dx === 6 || dy === 6;
        const core = dx >= 2 && dx <= 4 && dy >= 2 && dy <= 4;
        return edge || core;
      };
      if (inBox(0, 0)) return ring(0, 0);
      if (inBox(n - 7, 0)) return ring(n - 7, 0);
      if (inBox(0, n - 7)) return ring(0, n - 7);
      return null;
    };
    for (let y = 0; y < n; y++) {
      for (let x = 0; x < n; x++) {
        const f = finder(x, y);
        // keep a quiet zone around the finders
        const nearFinder = (x < 8 && y < 8) || (x >= n - 8 && y < 8) || (x < 8 && y >= n - 8);
        if (f !== null) cells.push(f);
        else if (nearFinder) cells.push(false);
        else cells.push((x * 7 + y * 13 + ((x * y) % 11)) % 5 < 2);
      }
    }
    return cells;
  }, [n]);
}

export function QrArt({
  size = 17,
  className,
  animated = true,
}: {
  size?: number;
  className?: string;
  animated?: boolean;
}) {
  const cells = useQrPattern(size);
  const reduce = useReducedMotion();
  return (
    <div
      className={cn("grid aspect-square gap-px rounded-md bg-card p-1.5", className)}
      style={{ gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))` }}
      aria-hidden
    >
      {cells.map((on, i) => {
        const x = i % size;
        const y = Math.floor(i / size);
        return animated && !reduce ? (
          <motion.span
            key={i}
            initial={{ opacity: 0, scale: 0.4 }}
            whileInView={{ opacity: on ? 1 : 0, scale: 1 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ delay: 0.15 + (x + y) * 0.018, duration: 0.25 }}
            className="rounded-[1px] bg-foreground"
          />
        ) : (
          <span key={i} className={cn("rounded-[1px]", on ? "bg-foreground" : "bg-transparent")} />
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Report: a miniature PDF that assembles itself                       */
/* ------------------------------------------------------------------ */

const REPORT_ROWS = [true, true, false, true, false, true, true];

export function ReportArt() {
  const reduce = useReducedMotion();
  return (
    <div className="relative flex h-full w-full items-center justify-center p-5">
      <motion.div
        initial={{ y: 18, opacity: 0, rotate: -1.5 }}
        whileInView={{ y: 0, opacity: 1, rotate: -1.5 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="w-[76%] overflow-hidden rounded-xl border border-border bg-background shadow-lift"
      >
        {/* header band */}
        <div className="flex items-center gap-2 bg-primary px-3 py-2">
          <span className="flex size-4 items-center justify-center rounded-[5px] bg-accent">
            <Check className="size-2.5 text-accent-foreground" />
          </span>
          <span className="h-1.5 w-14 rounded-full bg-primary-foreground/85" />
          <motion.span
            initial={{ scale: 0.6, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5, type: "spring", stiffness: 260, damping: 14 }}
            className="ml-auto rounded-full bg-destructive px-2 py-0.5 text-[7px] font-bold tracking-wide text-primary-foreground"
          >
            NON-COMPLIANT
          </motion.span>
        </div>

        {/* rows */}
        <div className="space-y-2 px-3 py-3">
          {REPORT_ROWS.map((ok, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.25 + i * 0.08, duration: 0.35 }}
              className="flex items-center gap-2"
            >
              <span
                className={cn("size-2 shrink-0 rounded-full", ok ? "bg-success" : "bg-destructive")}
              />
              <span className="h-1.5 flex-1 rounded-full bg-foreground/15" />
              <span className="h-1.5 w-7 rounded-full bg-foreground/10" />
              <span className="h-1 w-6 overflow-hidden rounded-full bg-muted">
                <motion.span
                  initial={{ width: 0 }}
                  whileInView={{ width: ok ? "92%" : "0%" }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.6 + i * 0.08, duration: 0.5 }}
                  className="block h-full rounded-full bg-success"
                />
              </span>
            </motion.div>
          ))}
        </div>

        {/* footer with QR */}
        <div className="flex items-end justify-between border-t border-border px-3 py-2.5">
          <div className="space-y-1.5">
            <span className="block h-1 w-16 rounded-full bg-foreground/10" />
            <span className="block h-1 w-10 rounded-full bg-foreground/10" />
            <span className="block h-1 w-12 rounded-full bg-accent/40" />
          </div>
          <QrArt size={13} className="w-9 p-0.5" />
        </div>
      </motion.div>

      {/* floating download pill */}
      <motion.div
        animate={reduce ? {} : { y: [0, -6, 0] }}
        transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-5 right-5 flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-[11px] font-semibold text-primary-foreground shadow-lift"
      >
        <FileDown className="size-3.5" /> Download PDF
      </motion.div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Share: QR code + link chip + a looping "copied" toast               */
/* ------------------------------------------------------------------ */

export function ShareArt() {
  const reduce = useReducedMotion();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (reduce) return;
    let hide: ReturnType<typeof setTimeout> | undefined;
    const id = setInterval(() => {
      setCopied(true);
      hide = setTimeout(() => setCopied(false), 1500);
    }, 3600);
    return () => {
      clearInterval(id);
      if (hide) clearTimeout(hide);
    };
  }, [reduce]);

  return (
    <div className="relative flex h-full w-full flex-col items-center justify-center gap-4 p-5">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        whileInView={{ scale: 1, opacity: 1 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="rounded-2xl border border-border bg-card p-2 shadow-lift"
      >
        <QrArt size={17} className="w-28 sm:w-32" />
      </motion.div>

      <motion.div
        initial={{ y: 10, opacity: 0 }}
        whileInView={{ y: 0, opacity: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 0.35, duration: 0.45 }}
        className="flex max-w-full items-center gap-2 rounded-full border border-border bg-background px-3 py-1.5 font-mono text-[10px] text-muted-foreground shadow-soft"
      >
        <Link2 className="size-3 shrink-0 text-accent" />
        <span className="truncate">sih.anshguptaa.in/report/e17139b4…</span>
        <motion.span
          animate={copied ? { scale: [1, 0.8, 1] } : {}}
          transition={{ duration: 0.3 }}
          className="ml-1 flex size-5 shrink-0 items-center justify-center rounded-full bg-secondary text-foreground"
        >
          {copied ? <Check className="size-3 text-success" /> : <Copy className="size-3" />}
        </motion.span>
      </motion.div>

      <AnimatePresence>
        {copied && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.25 }}
            className="absolute right-4 top-4 flex items-center gap-1.5 rounded-lg border border-success/40 bg-success/10 px-2.5 py-1.5 text-[11px] font-semibold text-success shadow-soft"
          >
            <Check className="size-3.5" /> Link copied
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
