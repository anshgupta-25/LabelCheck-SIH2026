import { useMemo, useState } from "react";
import { motion } from "motion/react";
import {
  CheckCircle2,
  XCircle,
  Info,
  ChevronDown,
  Pencil,
  ShieldCheck,
  ShieldAlert,
  Save,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  applyCorrection,
  finaliseReport,
  normaliseFields,
  type FieldResult,
  type RuleKey,
} from "@/lib/compliance";
import { cn } from "@/lib/utils";

interface Props {
  fields: FieldResult[];
  rawText: string;
  imageUrl?: string | null;
  ocrQuality?: number;
  onFieldsChange?: (fields: FieldResult[], verdict: "compliant" | "non_compliant") => void;
  /** Hide the correction controls (viewer is not the report owner). */
  readOnly?: boolean;
}

export function ReportView({
  fields,
  rawText,
  imageUrl,
  ocrQuality = 0.8,
  onFieldsChange,
  readOnly = false,
}: Props) {
  const [current, setCurrent] = useState<FieldResult[]>(() => normaliseFields(fields));
  const report = useMemo(() => finaliseReport(current, ocrQuality), [current, ocrQuality]);
  const compliant = report.verdict === "compliant";

  function update(key: RuleKey, value: string) {
    const next = applyCorrection(current, key, value);
    setCurrent(next);
    const rebuilt = finaliseReport(next, ocrQuality);
    onFieldsChange?.(next, rebuilt.verdict);
  }

  return (
    <TooltipProvider delayDuration={150}>
      <div className="space-y-8">
        {/* Verdict banner */}
        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: "spring", stiffness: 180, damping: 20 }}
          className={cn(
            "animate-verdict-pulse relative overflow-hidden rounded-3xl border p-6 shadow-lift sm:p-8",
            compliant
              ? "border-success/30 bg-success/10 text-success"
              : "border-destructive/30 bg-destructive/10 text-destructive",
          )}
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <motion.span
              initial={{ scale: 0, rotate: -25 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.15, type: "spring", stiffness: 220, damping: 14 }}
              className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-background/70"
            >
              {compliant ? <ShieldCheck className="size-8" /> : <ShieldAlert className="size-8" />}
            </motion.span>
            <div className="min-w-0">
              <p className="font-display text-3xl tracking-tight sm:text-3xl">
                {compliant ? "COMPLIANT" : "NON-COMPLIANT"}
              </p>
              <p className="mt-1 text-sm text-foreground/70">
                {compliant
                  ? "All mandatory declarations under Rule 6, LMPC Rules 2011 were detected on this package."
                  : `${report.missingCritical.length} mandatory declaration${
                      report.missingCritical.length === 1 ? "" : "s"
                    } missing — the package does not meet Rule 6, LMPC Rules 2011.`}
              </p>
            </div>
            <div className="sm:ml-auto sm:text-right">
              <p className="font-display text-3xl font-bold">{report.score}%</p>
              <p className="text-xs text-foreground/60">declarations present</p>
            </div>
          </div>
        </motion.div>

        <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
          {/* Checklist */}
          <div className="space-y-3">
            <h2 className="font-display text-lg font-bold">Mandatory declarations — Rule 6</h2>
            {current.map((field, i) => (
              <FieldCard
                key={field.key}
                field={field}
                index={i}
                onSave={update}
                readOnly={readOnly}
              />
            ))}

            {/* Raw OCR audit panel */}
            <Collapsible className="rounded-2xl border border-border bg-card shadow-soft">
              <CollapsibleTrigger className="group flex w-full items-center gap-3 px-5 py-4 text-left">
                <span className="text-sm font-semibold">Review extracted text</span>
                <span className="text-xs text-muted-foreground">
                  Full raw transcription — auditable, not a black box
                </span>
                <ChevronDown className="ml-auto size-4 transition-transform group-data-[state=open]:rotate-180" />
              </CollapsibleTrigger>
              <CollapsibleContent>
                <pre className="mx-5 mb-5 max-h-80 overflow-auto rounded-xl bg-muted p-4 font-mono text-xs leading-relaxed whitespace-pre-wrap text-muted-foreground">
                  {rawText || "No text was extracted from this image."}
                </pre>
              </CollapsibleContent>
            </Collapsible>
          </div>

          {/* Side panel */}
          <aside className="space-y-4">
            {imageUrl && (
              <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
                <img src={imageUrl} alt="Scanned product label" className="w-full object-cover" />
              </div>
            )}
            <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
              <p className="text-sm font-semibold">Extraction quality</p>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.round(report.ocrQuality * 100)}%` }}
                  transition={{ duration: 0.9, ease: "easeOut" }}
                  className="bg-primary-gradient h-full rounded-full"
                />
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                {Math.round(report.ocrQuality * 100)}% legibility. Low-quality captures reduce
                per-field confidence — re-shoot in even light for a stronger reading.
              </p>
            </div>

            {!compliant && (
              <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-5">
                <p className="text-sm font-semibold text-destructive">Violations found</p>
                <ul className="mt-3 space-y-3">
                  {report.missingCritical.map((f) => (
                    <li key={f.key} className="text-xs leading-relaxed text-muted-foreground">
                      <span className="font-semibold text-destructive">{f.ruleRef}</span> —{" "}
                      {f.violation.replace(/^Rule [^:]+:\s*/, "")}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </aside>
        </div>
      </div>
    </TooltipProvider>
  );
}

function FieldCard({
  field,
  index,
  onSave,
  readOnly,
}: {
  field: FieldResult;
  index: number;
  onSave: (key: RuleKey, value: string) => void;
  readOnly: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(field.value ?? "");

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.08 * index + 0.15, duration: 0.4, ease: "easeOut" }}
      className="rounded-2xl border border-border bg-card p-5 shadow-soft transition-shadow hover:shadow-lift"
    >
      <div className="flex items-start gap-3">
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.08 * index + 0.3, type: "spring", stiffness: 260, damping: 15 }}
          className={cn(
            "mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full",
            field.found ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive",
          )}
        >
          {field.found ? <CheckCircle2 className="size-5" /> : <XCircle className="size-5" />}
        </motion.span>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold">{field.label}</p>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  aria-label={`Legal requirement for ${field.label}`}
                  className="text-muted-foreground transition-colors hover:text-primary"
                >
                  <Info className="size-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs text-xs leading-relaxed">
                <span className="font-semibold">{field.ruleRef}</span> — {field.requirement}
              </TooltipContent>
            </Tooltip>
            <Badge variant="outline" className="text-[10px] font-medium">
              {field.ruleRef}
            </Badge>
            {!field.critical && (
              <Badge variant="secondary" className="text-[10px]">
                Advisory
              </Badge>
            )}
            {field.edited && (
              <Badge variant="secondary" className="text-[10px]">
                Manually verified
              </Badge>
            )}
          </div>

          {editing ? (
            <div className="mt-3 flex flex-wrap gap-2">
              <Input
                value={draft}
                autoFocus
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Enter the value printed on the label"
                className="h-10 flex-1 min-w-48"
              />
              <Button
                size="sm"
                className="h-10"
                onClick={() => {
                  onSave(field.key, draft);
                  setEditing(false);
                }}
              >
                <Save className="size-4" /> Save
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-10"
                onClick={() => {
                  setDraft(field.value ?? "");
                  setEditing(false);
                }}
              >
                <RotateCcw className="size-4" />
              </Button>
            </div>
          ) : (
            <p
              className={cn(
                "mt-1.5 text-sm break-words",
                field.found ? "text-foreground" : "text-destructive",
              )}
            >
              {field.found ? field.value : "Not found on this label"}
            </p>
          )}

          {!field.found && !editing && (
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{field.violation}</p>
          )}

          {field.matchedBy && field.found && (
            <p className="mt-1 text-[11px] text-muted-foreground">Matched by {field.matchedBy}</p>
          )}

          <div className="mt-3 flex items-center gap-3">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${field.confidence}%` }}
                transition={{ delay: 0.08 * index + 0.35, duration: 0.8, ease: "easeOut" }}
                className={cn(
                  "h-full rounded-full",
                  field.confidence >= 80
                    ? "bg-success"
                    : field.confidence >= 50
                      ? "bg-warning"
                      : "bg-destructive",
                )}
              />
            </div>
            <span className="w-16 text-right text-xs font-medium tabular-nums text-muted-foreground">
              {field.confidence}% conf.
            </span>
          </div>
        </div>

        {!editing && !readOnly && (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="shrink-0 rounded-lg p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            aria-label={`Correct ${field.label}`}
          >
            <Pencil className="size-4" />
          </button>
        )}
      </div>
    </motion.div>
  );
}
