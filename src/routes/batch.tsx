import { createFileRoute, Link } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { motion } from "motion/react";
import {
  Upload,
  Loader2,
  ShieldCheck,
  ShieldAlert,
  X,
  Layers,
  ArrowRight,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { analyseLabel } from "@/lib/compliance";
import { createScan, uploadLabelImage } from "@/lib/scans";
import { extractLabelText } from "@/lib/ocr.functions";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/batch")({
  head: () => ({
    meta: [
      { title: "Batch label check — LabelCheck" },
      {
        name: "description",
        content:
          "Upload several packaged product labels at once and get a single table of Rule 6 compliance verdicts — built for e-commerce catalogue pre-listing checks.",
      },
      { property: "og:title", content: "Batch label check — LabelCheck" },
      {
        property: "og:description",
        content: "Screen a whole catalogue of labels in one pass and export each verdict.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: BatchPage,
});

type Status = "queued" | "running" | "done" | "failed";

interface Item {
  id: string;
  file: File;
  preview: string;
  status: Status;
  verdict?: "compliant" | "non_compliant" | undefined;
  productName?: string | null | undefined;
  missing?: string[] | undefined;
  scanId?: string | undefined;
  error?: string | undefined;
}

const MAX = 8;

function BatchPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function addFiles(list: FileList | null) {
    if (!list) return;
    const picked = Array.from(list).filter((f) => f.type.startsWith("image/"));
    if (!picked.length) {
      toast.error("Please choose image files (JPG or PNG).");
      return;
    }
    setItems((prev) => {
      const room = MAX - prev.length;
      if (room <= 0) {
        toast.error(`You can check up to ${MAX} labels in one batch.`);
        return prev;
      }
      const next = picked.slice(0, room).map((f) => ({
        id: crypto.randomUUID(),
        file: f,
        preview: URL.createObjectURL(f),
        status: "queued" as Status,
      }));
      return [...prev, ...next];
    });
  }

  function patch(id: string, changes: Partial<Item>) {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...changes } : it)));
  }

  async function runBatch() {
    const queue = items.filter((it) => it.status === "queued" || it.status === "failed");
    if (!queue.length) return;
    setBusy(true);
    for (const item of queue) {
      patch(item.id, { status: "running", error: undefined });
      try {
        const dataUrl = await fileToDataUrl(item.file);
        const imagePath = await uploadLabelImage(
          item.file,
          item.file.type.includes("png") ? "png" : "jpg",
        );
        const { text } = await extractLabelText({
          data: { imageDataUrl: dataUrl, language: "eng" },
        });
        if (!text.trim()) throw new Error("No readable text on this photo.");
        const report = analyseLabel(text);
        const productName = report.fields.find((f) => f.key === "commodity_name")?.value ?? null;
        const scanId = await createScan({
          imagePath,
          extractedText: text,
          language: "eng",
          verdict: report.verdict,
          productName,
          source: "upload",
          fields: report.fields,
        });
        patch(item.id, {
          status: "done",
          verdict: report.verdict,
          productName,
          missing: report.missingCritical.map((f) => f.label),
          scanId,
        });
      } catch (e) {
        patch(item.id, {
          status: "failed",
          error: e instanceof Error ? e.message : "Check failed.",
        });
      }
    }
    setBusy(false);
    toast.success("Batch complete — verdicts are in the table below.");
  }

  const done = items.filter((i) => i.status === "done");
  const nonCompliant = done.filter((i) => i.verdict !== "compliant").length;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <Badge variant="secondary" className="rounded-full">
          <Layers className="size-3.5" /> Catalogue mode
        </Badge>
        <h1 className="mt-4 text-4xl sm:text-4xl">Batch label check</h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          Drop up to {MAX} label photos and get one table of Rule 6 verdicts — the same check an
          e-commerce team would run across a catalogue before listing.
        </p>
      </motion.div>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          addFiles(e.dataTransfer.files);
        }}
        className={cn(
          "mt-8 rounded-3xl border-2 border-dashed bg-card p-8 text-center shadow-soft transition-colors",
          dragging ? "border-primary bg-primary-soft" : "border-border",
        )}
      >
        <span className="bg-primary-gradient mx-auto flex size-14 items-center justify-center rounded-2xl text-primary-foreground shadow-lift">
          <Upload className="size-6" />
        </span>
        <p className="mt-4 text-lg font-semibold">Drop several label photos</p>
        <p className="mt-1 text-sm text-muted-foreground">
          JPG or PNG · up to {MAX} per batch · {items.length} selected
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-3">
          <Button className="h-11" onClick={() => inputRef.current?.click()} disabled={busy}>
            Choose images
          </Button>
          <Button
            className="h-11"
            variant="outline"
            disabled={busy || !items.length}
            onClick={runBatch}
          >
            {busy ? <Loader2 className="size-4 animate-spin" /> : <Layers className="size-4" />}
            {busy
              ? "Checking…"
              : `Check ${items.length || ""} label${items.length === 1 ? "" : "s"}`}
          </Button>
          {items.length > 0 && !busy && (
            <Button variant="ghost" className="h-11" onClick={() => setItems([])}>
              Clear
            </Button>
          )}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            addFiles(e.target.files);
            e.currentTarget.value = "";
          }}
        />
      </div>

      {done.length > 0 && (
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {[
            { label: "Labels checked", value: String(done.length), tone: "text-primary" },
            {
              label: "Compliant",
              value: String(done.length - nonCompliant),
              tone: "text-success",
            },
            {
              label: "Non-compliant",
              value: String(nonCompliant),
              tone: "text-destructive",
            },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl border border-border bg-card p-5 shadow-soft">
              <p className={cn("font-display text-4xl", s.tone)}>{s.value}</p>
              <p className="mt-1 text-sm text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {items.length > 0 && (
        <div className="mt-6 overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
          <div className="hidden grid-cols-[64px_1fr_150px_1fr_120px] gap-3 border-b border-border px-4 py-3 text-xs font-semibold text-muted-foreground sm:grid">
            <span>Label</span>
            <span>Commodity</span>
            <span>Verdict</span>
            <span>Missing declarations</span>
            <span className="text-right">Report</span>
          </div>
          {items.map((it) => {
            const ok = it.verdict === "compliant";
            return (
              <div
                key={it.id}
                className="grid grid-cols-[64px_1fr] items-center gap-3 border-b border-border/70 px-4 py-3 last:border-b-0 sm:grid-cols-[64px_1fr_150px_1fr_120px]"
              >
                <div className="relative size-14 overflow-hidden rounded-xl bg-muted">
                  <img src={it.preview} alt="" className="size-full object-cover" />
                  {it.status === "running" && (
                    <span className="absolute inset-0 flex items-center justify-center bg-background/70">
                      <Loader2 className="size-4 animate-spin text-primary" />
                    </span>
                  )}
                </div>

                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{it.productName || it.file.name}</p>
                  <p className="truncate text-xs text-muted-foreground sm:hidden">
                    {statusText(it)}
                  </p>
                </div>

                <div className="hidden sm:block">
                  {it.status === "done" ? (
                    <Badge
                      variant="outline"
                      className={cn(
                        ok
                          ? "border-success/40 text-success"
                          : "border-destructive/40 text-destructive",
                      )}
                    >
                      {ok ? (
                        <ShieldCheck className="size-3.5" />
                      ) : (
                        <ShieldAlert className="size-3.5" />
                      )}
                      {ok ? "Compliant" : "Non-compliant"}
                    </Badge>
                  ) : it.status === "failed" ? (
                    <Badge variant="outline" className="border-destructive/40 text-destructive">
                      <AlertTriangle className="size-3.5" /> Failed
                    </Badge>
                  ) : (
                    <span className="text-xs text-muted-foreground">{statusText(it)}</span>
                  )}
                </div>

                <p className="hidden truncate text-xs text-muted-foreground sm:block">
                  {it.status === "failed"
                    ? it.error
                    : it.missing?.length
                      ? it.missing.join(", ")
                      : it.status === "done"
                        ? "None"
                        : "—"}
                </p>

                <div className="hidden justify-end sm:flex">
                  {it.scanId ? (
                    <Button asChild size="sm" variant="ghost">
                      <Link to="/report/$id" params={{ id: it.scanId }}>
                        Open <ArrowRight className="size-4" />
                      </Link>
                    </Button>
                  ) : !busy ? (
                    <button
                      onClick={() => setItems((p) => p.filter((x) => x.id !== it.id))}
                      className="rounded-lg p-2 text-muted-foreground hover:text-foreground"
                      aria-label="Remove"
                    >
                      <X className="size-4" />
                    </button>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function statusText(it: Item) {
  if (it.status === "queued") return "Queued";
  if (it.status === "running") return "Checking…";
  if (it.status === "failed") return it.error ?? "Failed";
  return it.verdict === "compliant" ? "Compliant" : "Non-compliant";
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
