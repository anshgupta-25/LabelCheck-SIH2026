/**
 * Barcode identity panel.
 *
 * Sits beside the Rule 6 checklist, deliberately not inside it: a barcode is
 * not one of the seven mandatory declarations, so it must never read as an
 * eighth check or appear to move the compliance score. This panel answers a
 * different question — is the pack the product its barcode is registered to.
 */
import { motion } from "motion/react";
import { Barcode, Check, CircleAlert, Minus, PackageSearch } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { gs1Origin } from "@/lib/barcode";
import type { ScanBarcode } from "@/lib/barcode-report";
import type { CheckStatus } from "@/lib/barcode-crosscheck";

const STATUS_ICON: Record<CheckStatus, typeof Check> = {
  match: Check,
  mismatch: CircleAlert,
  unknown: Minus,
};

const STATUS_TONE: Record<CheckStatus, string> = {
  match: "text-success",
  mismatch: "text-warning",
  unknown: "text-muted-foreground",
};

export function BarcodePanel({ barcode }: { barcode?: ScanBarcode | null | undefined }) {
  const detected = !!barcode?.detected && !!barcode.value;
  const lookup = barcode?.lookup;
  const product = lookup?.product ?? null;
  const rows = barcode?.crossChecks ?? [];
  const origin = detected && barcode?.value ? gs1Origin(barcode.value) : null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="rounded-2xl border border-border bg-card p-5 shadow-soft"
      aria-label="Barcode"
    >
      <div className="flex items-center gap-2.5">
        <Barcode className="size-4 text-accent" />
        <h3 className="font-display text-base font-bold">Barcode</h3>
        <Badge
          variant={detected ? "secondary" : "outline"}
          className={cn("ml-auto text-[0.65rem]", detected && "text-success")}
        >
          {detected ? "Detected" : "Not detected"}
        </Badge>
      </div>

      {!detected ? (
        <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
          {barcode?.error
            ? barcode.error
            : "No barcode was found on this label. A barcode is not required by Rule 6, so this does not affect the compliance verdict."}
        </p>
      ) : (
        <>
          <dl className="mt-4 space-y-3">
            <div>
              <dt className="text-[0.65rem] uppercase tracking-wide text-muted-foreground">
                Barcode number
              </dt>
              <dd className="mt-0.5 font-mono text-lg font-semibold tabular-nums">
                {barcode?.value}
              </dd>
            </div>
            <div className="flex gap-6">
              <div>
                <dt className="text-[0.65rem] uppercase tracking-wide text-muted-foreground">
                  Format
                </dt>
                <dd className="mt-0.5 text-sm font-medium">{barcode?.format ?? "Unknown"}</dd>
              </div>
              {origin && (
                <div>
                  <dt className="text-[0.65rem] uppercase tracking-wide text-muted-foreground">
                    Issued by
                  </dt>
                  <dd className="mt-0.5 text-sm font-medium">{origin}</dd>
                </div>
              )}
            </div>
          </dl>

          {barcode?.all && barcode.all.length > 1 && (
            <p className="mt-3 text-[0.68rem] leading-relaxed text-muted-foreground">
              {barcode.all.length} symbols found on this pack; the retail product code is shown
              above.
            </p>
          )}

          {/* ---------------- product lookup ---------------- */}
          <div className="mt-5 border-t border-border pt-4">
            <div className="flex items-center gap-2">
              <PackageSearch className="size-3.5 text-muted-foreground" />
              <p className="text-xs font-semibold">Product database</p>
            </div>

            {product ? (
              <>
                <p className="mt-2 text-sm font-medium">{product.name ?? "Unnamed product"}</p>
                <p className="text-xs text-muted-foreground">
                  {[product.brand, product.quantity].filter(Boolean).join(" · ") || "—"}
                </p>
                <p className="mt-1 text-[0.65rem] text-muted-foreground">
                  Source: {product.source}
                </p>
              </>
            ) : (
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                {lookup?.message ??
                  "Barcode detected, but product database information is unavailable."}
              </p>
            )}
          </div>

          {/* ---------------- cross-check ---------------- */}
          {rows.length > 0 && (
            <div className="mt-4 border-t border-border pt-4">
              <p className="text-xs font-semibold">Cross-check against the label</p>
              <ul className="mt-2 space-y-1.5">
                {rows.map((r) => {
                  const Icon = STATUS_ICON[r.status];
                  return (
                    <li key={r.label} className="flex items-start gap-2 text-xs">
                      <Icon className={cn("mt-0.5 size-3.5 shrink-0", STATUS_TONE[r.status])} />
                      <span className="min-w-0">
                        <span className="font-medium">{r.label}</span>
                        {r.status === "mismatch" && (
                          <span className="text-muted-foreground">
                            {" "}
                            — pack reads {r.observed ? `"${r.observed}"` : "nothing"}, database has
                            &ldquo;{r.expected}&rdquo;
                          </span>
                        )}
                        {r.status === "match" && (
                          <span className="text-muted-foreground"> matches</span>
                        )}
                        {r.status === "unknown" && (
                          <span className="text-muted-foreground"> — {r.note}</span>
                        )}
                      </span>
                    </li>
                  );
                })}
              </ul>
              <p className="mt-3 text-[0.65rem] leading-relaxed text-muted-foreground">
                Identity signal only. A mismatch is a lead for an inspector, not a Rule 6 violation,
                and does not change the compliance verdict.
              </p>
            </div>
          )}
        </>
      )}
    </motion.section>
  );
}
