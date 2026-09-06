/**
 * Inspection pings floating over the hero globe.
 *
 * Illustrative, not telemetry: it cycles the seven Rule 6(1) declarations the
 * engine actually checks, showing both outcomes it can return, so the hero
 * says what the product does rather than just spinning. Labels and citations
 * come from RULES so they cannot drift from the engine.
 */
import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Check, X } from "lucide-react";
import { RULES, type RuleKey } from "@/lib/compliance";

/** Short forms of the rule labels; the full ones are far too long for a chip. */
const SHORT: Record<RuleKey, string> = {
  manufacturer: "Manufacturer & address",
  commodity_name: "Generic name",
  net_quantity: "Net quantity",
  manufacture_date: "Month & year of packing",
  mrp: "MRP incl. all taxes",
  consumer_care: "Consumer care",
  country_of_origin: "Country of origin",
};

/** Anchor points around the sphere, kept left of centre so chips never reach
 *  the headline column and never overflow the square on a narrow screen. */
const SPOTS = [
  { top: "12%", left: "22%" },
  { top: "31%", left: "2%" },
  { top: "47%", left: "24%" },
  { top: "63%", left: "0%" },
  { top: "79%", left: "18%" },
  { top: "24%", left: "11%" },
  { top: "69%", left: "26%" },
];

const PINGS = RULES.map((r, i) => ({
  key: r.key,
  ruleRef: r.ruleRef,
  label: SHORT[r.key],
  // One failure in the cycle, so the hero shows the engine can say no.
  ok: r.key !== "mrp",
  spot: SPOTS[i % SPOTS.length]!,
}));

export function GlobeCallouts() {
  const reduce = useReducedMotion();
  const [i, setI] = useState(0);

  useEffect(() => {
    if (reduce) return;
    const id = setInterval(() => setI((n) => (n + 1) % PINGS.length), 2600);
    return () => clearInterval(id);
  }, [reduce]);

  const ping = PINGS[i]!;

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.div
          key={ping.key}
          initial={{ opacity: 0, scale: 0.9, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: -6 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="absolute flex items-center gap-2"
          style={{ top: ping.spot.top, left: ping.spot.left }}
        >
          {/* the ping itself, sitting on the sphere */}
          <span className="relative flex size-2.5 shrink-0 items-center justify-center">
            <motion.span
              className={
                "absolute size-full rounded-full " + (ping.ok ? "bg-success" : "bg-destructive")
              }
              initial={{ opacity: 0.5, scale: 1 }}
              animate={reduce ? { opacity: 0.3 } : { opacity: [0.5, 0, 0.5], scale: [1, 3.2, 1] }}
              transition={{ duration: 2.2, repeat: Infinity, ease: "easeOut" }}
            />
            <span
              className={
                "relative size-1.5 rounded-full " + (ping.ok ? "bg-success" : "bg-destructive")
              }
            />
          </span>

          <div
            className={
              "flex min-w-0 items-center gap-2 rounded-full border py-1.5 pl-2 pr-3 shadow-soft backdrop-blur " +
              (ping.ok
                ? "border-success/35 bg-success/10"
                : "border-destructive/35 bg-destructive/10")
            }
          >
            <span
              className={
                "flex size-4 shrink-0 items-center justify-center rounded-full " +
                (ping.ok
                  ? "bg-success text-success-foreground"
                  : "bg-destructive text-destructive-foreground")
              }
            >
              {ping.ok ? <Check className="size-2.5" /> : <X className="size-2.5" />}
            </span>
            <span className="shrink-0 font-mono text-[0.6rem] text-accent">{ping.ruleRef}</span>
            <span className="truncate text-[0.7rem] font-semibold text-foreground">
              {ping.label}
            </span>
            <span
              className={
                "hidden shrink-0 text-[0.6rem] font-medium sm:inline " +
                (ping.ok ? "text-success" : "text-destructive")
              }
            >
              {ping.ok ? "Verified" : "Not declared"}
            </span>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* progress through the seven, so the cycle reads as deliberate */}
      <div className="absolute bottom-0 left-0 flex gap-1.5">
        {PINGS.map((p, n) => (
          <span
            key={p.key}
            className={
              "h-1 rounded-full transition-all duration-500 " +
              (n === i ? "w-5 bg-accent" : "w-1.5 bg-border")
            }
          />
        ))}
      </div>
    </div>
  );
}
