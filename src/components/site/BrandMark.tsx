/**
 * The LabelCheck mark: the same tick-in-a-label shape as the favicon and the
 * PDF header, drawn as SVG so it stays crisp at any size and picks up the
 * theme. One component so the browser tab, the navbar and the reports can
 * never drift apart.
 */
export function BrandMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      aria-hidden
      className={className}
      role="presentation"
      focusable="false"
    >
      <rect
        x="3.5"
        y="3.5"
        width="41"
        height="41"
        rx="12"
        className="fill-accent stroke-foreground"
        strokeWidth="3"
      />
      {/* the punch-hole that makes it read as a swing tag rather than a box */}
      <circle
        cx="14"
        cy="13.5"
        r="4"
        className="fill-background stroke-foreground"
        strokeWidth="3"
      />
      <path
        d="M13 26.5 L20.5 34.5 L35.5 16.5"
        className="stroke-background"
        strokeWidth="6.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
