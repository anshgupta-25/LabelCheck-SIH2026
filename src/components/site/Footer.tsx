import { Link } from "@tanstack/react-router";
import { BrandMark } from "@/components/site/BrandMark";

export function Footer() {
  return (
    <footer className="mt-24 border-t border-border bg-secondary/40">
      <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-3">
        <div>
          <div className="flex items-center gap-2.5">
            <BrandMark className="size-8 shrink-0" />
            <span className="font-display text-base font-bold">LabelCheck</span>
          </div>
          <p className="mt-3 max-w-xs text-sm text-muted-foreground">
            Instant Legal Metrology compliance verification for pre-packaged commodities.
          </p>
        </div>

        <div className="text-sm">
          <p className="font-semibold">Product</p>
          <ul className="mt-3 space-y-2 text-muted-foreground">
            <li>
              <Link to="/scan" className="hover:text-foreground">
                Scan a label
              </Link>
            </li>
            <li>
              <Link to="/history" className="hover:text-foreground">
                Inspection history
              </Link>
            </li>
            <li>
              <Link to="/how-it-works" className="hover:text-foreground">
                How it works
              </Link>
            </li>
            <li>
              <Link to="/pitch" className="hover:text-foreground">
                Our pitch
              </Link>
            </li>
          </ul>
        </div>

        <div className="text-sm">
          <p className="font-semibold">Legal basis</p>
          <p className="mt-3 text-muted-foreground">
            Legal Metrology Act, 2009 · Legal Metrology (Packaged Commodities) Rules, 2011 — Rule 6
            mandatory declarations.
          </p>
        </div>
      </div>

      <div className="border-t border-border">
        <p className="mx-auto w-full max-w-6xl px-4 py-5 text-center text-xs text-muted-foreground sm:px-6">
          Built for Smart India Hackathon 2026 · Ministry of Consumer Affairs · SIH26034
        </p>
      </div>
    </footer>
  );
}
