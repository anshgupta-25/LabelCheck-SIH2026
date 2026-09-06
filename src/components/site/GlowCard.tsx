/**
 * The card treatment used across the marketing pages.
 *
 * Three layered effects, all pure CSS driven so they cost nothing per frame:
 * a cursor-tracked spotlight (the pointer position is written to --mx/--my on
 * mousemove), a hairline that draws across the top edge on hover, and a lift.
 * Motion is dropped entirely when the visitor asks for reduced motion.
 */
import { useRef, type ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

export function GlowCard({
  children,
  className,
  delay = 0,
  spotlight = 240,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  /** Radius of the cursor spotlight, in px. */
  spotlight?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();

  return (
    <motion.div
      initial={reduce ? { opacity: 0 } : { opacity: 0, y: 22 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-70px" }}
      transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}
      className="h-full"
    >
      <div
        ref={ref}
        onMouseMove={(e) => {
          const el = ref.current;
          if (!el) return;
          const r = el.getBoundingClientRect();
          el.style.setProperty("--mx", `${e.clientX - r.left}px`);
          el.style.setProperty("--my", `${e.clientY - r.top}px`);
        }}
        className={cn(
          "group relative h-full overflow-hidden rounded-2xl border border-border bg-card shadow-soft",
          "transition-all duration-300 hover:-translate-y-1 hover:border-accent/40 hover:shadow-lift",
          className,
        )}
      >
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          style={{
            background: `radial-gradient(${spotlight}px circle at var(--mx, 50%) var(--my, 0px), color-mix(in oklab, var(--accent) 16%, transparent), transparent 72%)`,
          }}
        />
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-px origin-left scale-x-0 bg-gradient-to-r from-transparent via-accent to-transparent transition-transform duration-500 group-hover:scale-x-100"
        />
        <div className="relative flex h-full flex-col">{children}</div>
      </div>
    </motion.div>
  );
}

/**
 * The rounded icon plate that heads most cards. Lifts and brightens with its
 * parent GlowCard, so it must sit inside one to animate.
 */
export function IconTile({
  icon: Icon,
  className,
  size = "md",
}: {
  icon: React.ComponentType<{ className?: string }>;
  className?: string;
  size?: "sm" | "md";
}) {
  return (
    <span
      className={cn(
        "bg-primary-gradient relative flex items-center justify-center rounded-xl text-primary-foreground",
        "transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3",
        size === "sm" ? "size-10" : "size-12",
        className,
      )}
    >
      <span
        aria-hidden
        className="absolute inset-0 rounded-xl bg-accent opacity-0 blur-lg transition-opacity duration-300 group-hover:opacity-50"
      />
      <Icon className={cn("relative", size === "sm" ? "size-5" : "size-6")} />
    </span>
  );
}
