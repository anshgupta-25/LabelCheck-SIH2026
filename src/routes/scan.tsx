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
          "Upload or photograph a packaged product label to instantly verify its mandatory Legal Metrology declarations.",
      },
      { property: "og:title", content: "Scan a label — LabelCheck" },
      {
        property: "og:description",
        content: "Instant Rule 6 compliance checks on any packaged commodity label.",
      },
    ],
  }),
  component: ScanPage,
});

const STAGES = [
  "Uploading image",
  "Extracting text from label",
  "Running Rule 6 detection",
  "Scoring confidence & building report",
];

function ScanPage() {
  const navigate = useNavigate();
  const { demo } = Route.useSearch();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [language, setLanguage] = useState<"eng" | "hin">("eng");
  const [busy, setBusy] = useState(false);
  const [stage, setStage] = useState(0);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const autoRan = useRef(false);

  const onPick = useCallback((f: File | undefined | null) => {
    if (!f) return;
    if (!f.type.startsWith("image/")) {
      toast.error("Please choose an image file (JPG or PNG).");
      return;
    }
    if (f.size > 10 * 1024 * 1024) {
      toast.error("Image is larger than 10 MB. Please use a smaller photo.");
      return;
    }
    setFile(f);
    setPreview(URL.createObjectURL(f));
  }, []);

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
        // fixed verdict. No OCR call, no network dependency on the result.
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

  async function runScan() {
    if (!file) return;
    setBusy(true);
    setStage(0);
    try {
      const dataUrl = await fileToDataUrl(file);
      const imagePath = await uploadLabelImage(file, file.type.includes("png") ? "png" : "jpg");

      setStage(1);
      const { text } = await extractLabelText({ data: { imageDataUrl: dataUrl, language } });
      if (!text.trim()) {
        throw new Error("No text could be read from that photo. Try better lighting or a closer shot.");
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

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-12 sm:px-6 sm:py-16">
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}>
        <Badge variant="secondary" className="rounded-full">
          Rule 6 · LMPC Rules 2011
        </Badge>
        <h1 className="mt-4 text-4xl sm:text-4xl">Scan a product label</h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          Photograph the principal display panel — the face of the pack carrying the declarations.
          Keep the text sharp and evenly lit for the strongest confidence scores.
        </p>
      </motion.div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_300px]">
        {/* Dropzone / preview */}
        <div>
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              onPick(e.dataTransfer.files?.[0]);
            }}
            className={cn(
              "relative overflow-hidden rounded-3xl border-2 border-dashed bg-card p-6 shadow-soft transition-colors",
              dragging ? "border-primary bg-primary-soft" : "border-border",
            )}
          >
            <AnimatePresence mode="wait">
              {preview ? (
                <motion.div
                  key="preview"
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="relative"
                >
                  <div className="relative overflow-hidden rounded-2xl bg-muted">
                    <img
                      src={preview}
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
                    <button
                      onClick={() => {
                        setFile(null);
                        setPreview(null);
                      }}
                      className="absolute right-3 top-3 rounded-full bg-background/90 p-2 shadow-soft transition-colors hover:bg-background"
                      aria-label="Remove image"
                    >
                      <X className="size-4" />
                    </button>
                  )}
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center justify-center px-4 py-14 text-center"
                >
                  <motion.span
                    animate={{ y: [0, -7, 0] }}
                    transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
                    className="bg-primary-gradient flex size-16 items-center justify-center rounded-2xl text-primary-foreground shadow-lift"
                  >
                    <Upload className="size-7" />
                  </motion.span>
                  <p className="mt-5 text-lg font-semibold">Drop a label photo here</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    JPG or PNG, up to 10 MB — or use your camera
                  </p>
                  <div className="mt-6 flex flex-wrap justify-center gap-3">
                    <Button className="h-12 px-5" onClick={() => inputRef.current?.click()}>
                      <Upload className="size-4" /> Choose image
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
              )}
            </AnimatePresence>

            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => onPick(e.target.files?.[0])}
            />
            <input
              ref={cameraRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => onPick(e.target.files?.[0])}
            />
          </div>

          {/* Progress stages */}
          <AnimatePresence>
            {busy && (
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

          {preview && !busy && (
            <Button className="mt-5 h-13 w-full py-4 text-base" onClick={runScan}>
              <ScanLine className="size-5" /> Run compliance scan
            </Button>
          )}
        </div>

        {/* Sidebar */}
        <aside className="space-y-4">
          <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
            <p className="text-sm font-semibold">Label language</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Affects how the text is transcribed. Hindi mode reads Devanagari alongside English.
            </p>
            <Select value={language} onValueChange={(v) => setLanguage(v as "eng" | "hin")}>
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
              <FlaskConical className="size-4 text-accent-foreground" />
              <p className="text-sm font-semibold text-accent-foreground">Demo Mode</p>
            </div>
            <p className="mt-1 text-xs text-accent-foreground/80">
              Run a pre-set sample label — no upload, no network needed.
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
              core declarations are missing.{" "}
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

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Could not read the selected image."));
    reader.readAsDataURL(file);
  });
}
