import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Upload,
  Camera,
  ScanLine,
  Sparkles,
  X,
  Loader2,
  FlaskConical,
  CheckCircle2,
  Layers,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  ArrowRight,
  Plus,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { analyseLabel } from "@/lib/compliance";
import { DEMO_LABELS, getDemoLabel } from "@/lib/demo-labels";
import { createScan, uploadLabelImage } from "@/lib/scans";
import { extractLabelText } from "@/lib/ocr.functions";
import { RequireAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/scan")({
  validateSearch: (search: Record<string, unknown>): { demo?: string | undefined } => ({
    demo: typeof search["demo"] === "string" ? search["demo"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Scan a label — LabelCheck compliance scanner" },
      {
        name: "description",
        content:
          "Upload or photograph a packaged product label — or up to eight at once — to instantly verify the mandatory Legal Metrology declarations.",
      },
      { property: "og:title", content: "Scan a label — LabelCheck" },
      {
        property: "og:description",
        content: "Instant Rule 6 compliance checks on one label or a whole batch.",
      },
    ],
  }),
  component: () => (
    <RequireAuth>
      <ScanPage />
    </RequireAuth>
  ),
});

const STAGES = [
  "Uploading image",
  "Extracting text from label",
  "Running Rule 6 detection",
  "Scoring confidence & building report",
];

/** Maximum photos in one batch. */
const MAX = 8;
const MAX_BYTES = 10 * 1024 * 1024;

type Status = "queued" | "running" | "done" | "failed";
type Language = "eng" | "hin";

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

function ScanPage() {
  const navigate = useNavigate();
  const { demo } = Route.useSearch();
  const [items, setItems] = useState<Item[]>([]);
  const [language, setLanguage] = useState<Language>("eng");
  const [busy, setBusy] = useState(false);
  const [stage, setStage] = useState(0);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const autoRan = useRef(false);

  /* ----------------------------- selection ----------------------------- */

  const addFiles = useCallback((list: FileList | File[] | null | undefined) => {
    if (!list) return;
    const picked = Array.from(list);
    const valid: File[] = [];
    for (const f of picked) {
      if (!f.type.startsWith("image/")) {
        toast.error(`${f.name}: not an image (use JPG or PNG).`);
        continue;
      }
      if (f.size > MAX_BYTES) {
        toast.error(`${f.name}: larger than 10 MB.`);
        continue;
      }
      valid.push(f);
    }
    if (!valid.length) return;
    setItems((prev) => {
      const room = MAX - prev.length;
      if (room <= 0) {
        toast.error(`You can check up to ${MAX} labels in one batch.`);
        return prev;
      }
      if (valid.length > room) toast.message(`Only the first ${room} added — ${MAX} per batch.`);
      const next = valid.slice(0, room).map<Item>((f) => ({
        id: crypto.randomUUID(),
        file: f,
        preview: URL.createObjectURL(f),
        status: "queued",
      }));
      return [...prev, ...next];
    });
  }, []);

  const patch = useCallback((id: string, changes: Partial<Item>) => {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...changes } : it)));
  }, []);

  function removeItem(id: string) {
    setItems((prev) => {
      const gone = prev.find((it) => it.id === id);
      if (gone) URL.revokeObjectURL(gone.preview);
      return prev.filter((it) => it.id !== id);
    });
  }

  function clearAll() {
    items.forEach((it) => URL.revokeObjectURL(it.preview));
    setItems([]);
    setStage(0);
  }

  /* ------------------------------- demo -------------------------------- */

  const runDemo = useCallback(
    async (id: string) => {
      const label = getDemoLabel(id);
      if (!label) return;
      setBusy(true);
      setStage(1);
      try {
        await new Promise((r) => setTimeout(r, 500));
        setStage(2);
        await new Promise((r) => setTimeout(r, 400));
        setStage(3);
        // Demo Mode is fully deterministic: fixed transcription, fixed fields,
        // fixed verdict. No OCR call; only the report row is saved.
        const scanId = await createScan({
          imagePath: label.image,
          extractedText: label.text,
          language: "eng",
          verdict: label.verdict,
          productName: label.productName,
          source: "demo",
          fields: label.fields,
        });
        await navigate({ to: "/report/$id", params: { id: scanId } });
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Demo scan failed.");
        setBusy(false);
        setStage(0);
      }
    },
    [navigate],
  );

  // Deep-link: /scan?demo=compliant launches Demo Mode immediately.
  useEffect(() => {
    if (demo && !autoRan.current) {
      autoRan.current = true;
      void runDemo(demo);
    }
  }, [demo, runDemo]);

  /* ------------------------------ scanning ----------------------------- */

  /** Full pipeline for one photo: upload → OCR → rule engine → persist. */
  async function scanOne(file: File) {
    const dataUrl = await fileToDataUrl(file);
    const imagePath = await uploadLabelImage(file, file.type.includes("png") ? "png" : "jpg");
    const { text } = await extractLabelText({ data: { imageDataUrl: dataUrl, language } });
    if (!text.trim()) {
      throw new Error(
        "No text could be read from that photo. Try better lighting or a closer shot.",
      );
    }
    const report = analyseLabel(text);
    const productName = report.fields.find((f) => f.key === "commodity_name")?.value ?? null;
    const scanId = await createScan({
      imagePath,
      extractedText: text,
      language,
      verdict: report.verdict,
      productName,
      source: "upload",
      fields: report.fields,
    });
    return { report, productName, scanId };
  }

  async function runSingle(item: Item) {
    setBusy(true);
    setStage(0);
    try {
      const dataUrl = await fileToDataUrl(item.file);
      const imagePath = await uploadLabelImage(
        item.file,
        item.file.type.includes("png") ? "png" : "jpg",
      );
      setStage(1);
      const { text } = await extractLabelText({ data: { imageDataUrl: dataUrl, language } });
      if (!text.trim()) {
        throw new Error(
          "No text could be read from that photo. Try better lighting or a closer shot.",
        );
      }
      setStage(2);
      const report = analyseLabel(text);
      await new Promise((r) => setTimeout(r, 400));
      setStage(3);
      const scanId = await createScan({
        imagePath,
        extractedText: text,
        language,
        verdict: report.verdict,
        productName: report.fields.find((f) => f.key === "commodity_name")?.value ?? null,
        source: "upload",
        fields: report.fields,
      });
      await navigate({ to: "/report/$id", params: { id: scanId } });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Scan failed. Please try again.");
      setBusy(false);
      setStage(0);
    }
  }

  async function runBatch() {
    const queue = items.filter((it) => it.status === "queued" || it.status === "failed");
    if (!queue.length) return;
    setBusy(true);
    for (const item of queue) {
      patch(item.id, { status: "running", error: undefined });
      try {
        const { report, productName, scanId } = await scanOne(item.file);
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

  function runScan() {
    if (!items.length || busy) return;
    if (items.length === 1) void runSingle(items[0]!);
    else void runBatch();
  }

  /* ------------------------------- derived ----------------------------- */

  const isBatch = items.length > 1;
  const pending = items.filter((it) => it.status === "queued" || it.status === "failed");
  const done = items.filter((it) => it.status === "done");
  const failed = items.filter((it) => it.status === "failed");
  const nonCompliant = done.filter((it) => it.verdict !== "compliant").length;
  const single = items[0];

  /* -------------------------------- view ------------------------------- */

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}>
        <Badge variant="secondary" className="rounded-full">
          Rule 6 · LMPC Rules 2011
        </Badge>
        <h1 className="mt-4 text-4xl sm:text-4xl">Scan a product label</h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          Photograph the principal display panel — the face of the pack carrying the declarations.
          Drop one photo for a full report, or up to {MAX} for a batch check.
        </p>
      </motion.div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_300px]">
        {/* ------------------------------ main column ------------------------------ */}
        <div>
          <div
            onDragOver={(e) => {
              e.preventDefault();
              if (!busy) setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              if (!busy) addFiles(e.dataTransfer.files);
            }}
            className={cn(
              "relative overflow-hidden rounded-3xl border-2 border-dashed bg-card p-6 shadow-soft transition-colors",
              dragging ? "border-primary bg-primary-soft" : "border-border",
            )}
          >
            <AnimatePresence mode="wait">
              {items.length === 0 ? (
                /* ---------- empty hero ---------- */
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center justify-center px-4 py-14 text-center"
                >
                  <span className="absolute right-4 top-4 inline-flex items-center gap-1.5 rounded-full border border-accent/40 bg-accent/10 px-3 py-1 text-[11px] font-semibold text-accent">
                    <Layers className="size-3.5" /> Batch ready · up to {MAX}
                  </span>
                  <motion.span
                    animate={{ y: [0, -7, 0] }}
                    transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
                    className="bg-primary-gradient flex size-16 items-center justify-center rounded-2xl text-primary-foreground shadow-lift"
                  >
                    <Upload className="size-7" />
                  </motion.span>
                  <p className="mt-5 text-lg font-semibold">Drop a label photo here</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    JPG or PNG, up to 10 MB each — one label, or several for a batch check
                  </p>
                  <div className="mt-6 flex flex-wrap justify-center gap-3">
                    <Button className="h-12 px-5" onClick={() => inputRef.current?.click()}>
                      <Upload className="size-4" /> Choose images
                    </Button>
                    <Button
                      variant="outline"
                      className="h-12 px-5"
                      onClick={() => cameraRef.current?.click()}
                    >
                      <Camera className="size-4" /> Take a photo
                    </Button>
                  </div>
                </motion.div>
              ) : !isBatch && single ? (
                /* ---------- single preview ---------- */
                <motion.div
                  key="single"
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="relative"
                >
                  <div className="relative overflow-hidden rounded-2xl bg-muted">
                    <img
                      src={single.preview}
                      alt="Selected product label"
                      className="mx-auto max-h-[26rem] w-full object-contain"
                    />
                    {busy && (
                      <>
                        <div className="absolute inset-0 bg-primary/10" />
                        <div className="animate-scanline absolute left-0 h-24 w-full bg-gradient-to-b from-transparent via-primary/40 to-transparent" />
                        <div className="animate-scanline absolute left-0 h-0.5 w-full bg-primary shadow-[0_0_18px_4px_var(--color-primary)]" />
                      </>
                    )}
                  </div>
                  {!busy && (
                    <>
                      <button
                        onClick={() => removeItem(single.id)}
                        className="absolute right-3 top-3 rounded-full bg-background/90 p-2 shadow-soft transition-colors hover:bg-background"
                        aria-label="Remove image"
                      >
                        <X className="size-4" />
                      </button>
                      <button
                        onClick={() => inputRef.current?.click()}
                        className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-full bg-background/90 px-3 py-1.5 text-xs font-medium shadow-soft transition-colors hover:bg-background"
                      >
                        <Plus className="size-3.5" /> Add more for a batch
                      </button>
                    </>
                  )}
                </motion.div>
              ) : (
                /* ---------- batch grid ---------- */
                <motion.div
                  key="batch"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <div className="mb-4 flex flex-wrap items-center gap-3">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/40 bg-accent/10 px-3 py-1 text-[11px] font-semibold text-accent">
                      <Layers className="size-3.5" /> Batch check
                    </span>
                    <p className="text-sm text-muted-foreground">
                      {items.length} of {MAX} labels selected
                    </p>
                    {!busy && (
                      <button
                        onClick={clearAll}
                        className="ml-auto text-xs font-medium text-muted-foreground hover:text-foreground"
                      >
                        Clear all
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                    {items.map((it) => (
                      <div
                        key={it.id}
                        className="group relative aspect-square overflow-hidden rounded-2xl border border-border bg-muted"
                      >
                        <img src={it.preview} alt="" className="size-full object-cover" />
                        {it.status === "running" && (
                          <span className="absolute inset-0 flex items-center justify-center bg-background/70">
                            <Loader2 className="size-5 animate-spin text-primary" />
                          </span>
                        )}
                        {it.status === "done" && (
                          <span
                            className={cn(
                              "absolute left-2 top-2 flex size-6 items-center justify-center rounded-full text-primary-foreground shadow-soft",
                              it.verdict === "compliant" ? "bg-success" : "bg-destructive",
                            )}
                          >
                            {it.verdict === "compliant" ? (
                              <ShieldCheck className="size-3.5" />
                            ) : (
                              <ShieldAlert className="size-3.5" />
                            )}
                          </span>
                        )}
                        {it.status === "failed" && (
                          <span className="absolute left-2 top-2 flex size-6 items-center justify-center rounded-full bg-warning text-warning-foreground shadow-soft">
                            <AlertTriangle className="size-3.5" />
                          </span>
                        )}
                        {!busy && it.status !== "done" && (
                          <button
                            onClick={() => removeItem(it.id)}
                            className="absolute right-2 top-2 rounded-full bg-background/90 p-1.5 shadow-soft transition-colors hover:bg-background"
                            aria-label="Remove image"
                          >
                            <X className="size-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                    {!busy && items.length < MAX && (
                      <button
                        onClick={() => inputRef.current?.click()}
                        className="flex aspect-square flex-col items-center justify-center gap-1.5 rounded-2xl border-2 border-dashed border-border text-muted-foreground transition-colors hover:border-primary hover:text-foreground"
                      >
                        <Plus className="size-5" />
                        <span className="text-xs font-medium">Add more</span>
                      </button>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

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
            <input
              ref={cameraRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => {
                addFiles(e.target.files);
                e.currentTarget.value = "";
              }}
            />
          </div>

          {/* Single-scan progress stages (also used by Demo Mode) */}
          <AnimatePresence>
            {busy && !isBatch && (
              <motion.ol
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-5 space-y-2.5 overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-soft"
              >
                {STAGES.map((s, i) => (
                  <li key={s} className="flex items-center gap-3 text-sm">
                    {i < stage ? (
                      <CheckCircle2 className="size-4 text-success" />
                    ) : i === stage ? (
                      <Loader2 className="size-4 animate-spin text-primary" />
                    ) : (
                      <span className="size-4 rounded-full border border-border" />
                    )}
                    <span className={i <= stage ? "text-foreground" : "text-muted-foreground"}>
                      {s}
                    </span>
                  </li>
                ))}
              </motion.ol>
            )}
          </AnimatePresence>

          {/* Primary action */}
          {items.length > 0 && !busy && (isBatch ? pending.length > 0 : true) && (
            <Button className="mt-5 h-13 w-full py-4 text-base" onClick={runScan}>
              {isBatch ? (
                <>
                  <Layers className="size-5" />
                  {failed.length && done.length
                    ? `Retry ${failed.length} failed`
                    : `Check ${pending.length} label${pending.length === 1 ? "" : "s"}`}
                </>
              ) : (
                <>
                  <ScanLine className="size-5" /> Run compliance scan
                </>
              )}
            </Button>
          )}
          {isBatch && busy && (
            <div className="mt-5 flex items-center gap-3 rounded-2xl border border-border bg-card p-4 text-sm shadow-soft">
              <Loader2 className="size-4 animate-spin text-primary" />
              Checking {done.length + failed.length + 1} of {items.length}…
            </div>
          )}

          {/* Batch results */}
          {isBatch && done.length > 0 && (
            <BatchResults items={items} done={done} nonCompliant={nonCompliant} busy={busy} />
          )}
        </div>

        {/* ------------------------------ sidebar ------------------------------ */}
        <aside className="space-y-4">
          <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
            <p className="text-sm font-semibold">Label language</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Affects how the text is transcribed. Hindi mode reads Devanagari alongside English.
            </p>
            <Select
              value={language}
              onValueChange={(v) => setLanguage(v as Language)}
              disabled={busy}
            >
              <SelectTrigger className="mt-3 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="eng">English</SelectItem>
                <SelectItem value="hin">हिन्दी (Hindi)</SelectItem>
              </SelectContent>
            </Select>
            <p className="mt-3 text-xs text-muted-foreground">
              Roadmap: Tamil, Telugu, Bengali, Marathi and Gujarati label support.
            </p>
          </div>

          <div className="rounded-2xl border border-accent/40 bg-accent/10 p-5">
            <div className="flex items-center gap-2">
              <FlaskConical className="size-4 text-accent" />
              <p className="text-sm font-semibold text-accent">Demo Mode</p>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Run a pre-set sample label — no photo or OCR needed, same result every time.
            </p>
            <div className="mt-4 space-y-2">
              {DEMO_LABELS.map((d) => (
                <button
                  key={d.id}
                  disabled={busy}
                  onClick={() => runDemo(d.id)}
                  className="flex w-full items-center gap-3 rounded-xl border border-border bg-card p-3 text-left transition-all hover:-translate-y-0.5 hover:shadow-soft disabled:opacity-60"
                >
                  <img
                    src={d.image}
                    alt={`${d.title} sample`}
                    loading="lazy"
                    width={1024}
                    height={1024}
                    className="size-12 shrink-0 rounded-lg object-cover"
                  />
                  <span className="min-w-0">
                    <span className="flex items-center gap-1.5 text-sm font-semibold">
                      <Sparkles className="size-3.5 text-accent" />
                      {d.title}
                    </span>
                    <span className="mt-1 block text-xs text-muted-foreground">{d.subtitle}</span>
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5 text-xs leading-relaxed text-muted-foreground shadow-soft">
            <p className="text-sm font-semibold text-foreground">What gets checked</p>
            <p className="mt-2">
              All seven declarations of Rule 6, LMPC Rules 2011. A package fails if any of the six
              core declarations are missing. Every report can be exported as a cited PDF with a QR
              code back to the live verdict.{" "}
              <Link to="/how-it-works" className="font-medium text-primary hover:underline">
                Read the method →
              </Link>
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* Batch results table                                                    */
/* ---------------------------------------------------------------------- */

function BatchResults({
  items,
  done,
  nonCompliant,
  busy,
}: {
  items: Item[];
  done: Item[];
  nonCompliant: number;
  busy: boolean;
}) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mt-6">
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Labels checked", value: String(done.length), tone: "text-primary" },
          { label: "Compliant", value: String(done.length - nonCompliant), tone: "text-success" },
          { label: "Non-compliant", value: String(nonCompliant), tone: "text-destructive" },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border border-border bg-card p-5 shadow-soft">
            <p className={cn("font-display text-4xl", s.tone)}>{s.value}</p>
            <p className="mt-1 text-sm text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
        <div className="hidden grid-cols-[56px_1fr_140px_1fr_100px] gap-3 border-b border-border px-4 py-3 text-xs font-semibold text-muted-foreground sm:grid">
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
              className="grid grid-cols-[56px_1fr] items-center gap-3 border-b border-border/70 px-4 py-3 last:border-b-0 sm:grid-cols-[56px_1fr_140px_1fr_100px]"
            >
              <div className="relative size-12 overflow-hidden rounded-xl bg-muted">
                <img src={it.preview} alt="" className="size-full object-cover" />
                {it.status === "running" && (
                  <span className="absolute inset-0 flex items-center justify-center bg-background/70">
                    <Loader2 className="size-4 animate-spin text-primary" />
                  </span>
                )}
              </div>

              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{it.productName || it.file.name}</p>
                <p className="truncate text-xs text-muted-foreground sm:hidden">{statusText(it)}</p>
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
                  <Badge variant="outline" className="border-warning/60 text-warning-foreground">
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
                ) : busy ? null : (
                  <span className="text-xs text-muted-foreground">—</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
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
    reader.onerror = () => reject(new Error("Could not read the selected image."));
    reader.readAsDataURL(file);
  });
}
