import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { motion } from "motion/react";
import {
  ArrowLeft,
  ScanLine,
  Loader2,
  History,
  FileDown,
  Link2,
  Check,
  Mail,
  Send,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ReportView } from "@/components/report/ReportView";
import { getScan, signedImageUrl, updateScanFields } from "@/lib/scans";
import { downloadReportPdf } from "@/lib/report-pdf";
import { useAuth } from "@/lib/auth";
import { emailReport } from "@/lib/email.functions";
import { demoScanRow } from "@/lib/demo-labels";
import {
  estimateOcrQuality,
  finaliseReport,
  normaliseFields,
  type FieldResult,
  type Verdict,
} from "@/lib/compliance";

export const Route = createFileRoute("/report/$id")({
  head: () => ({
    meta: [
      { title: "Compliance report — LabelCheck" },
      {
        name: "description",
        content:
          "Per-field Legal Metrology compliance report with extracted values, confidence scores and statutory citations.",
      },
      { property: "og:title", content: "Compliance report — LabelCheck" },
      {
        property: "og:description",
        content: "Rule 6 verdict with per-declaration confidence scoring and legal citations.",
      },
    ],
  }),
  component: ReportPage,
});

function ReportPage() {
  const { id } = Route.useParams();
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [copied, setCopied] = useState(false);
  const { user, session } = useAuth();
  const [mailOpen, setMailOpen] = useState(false);
  const [mailTo, setMailTo] = useState("");
  const [mailNote, setMailNote] = useState("");
  const [mailing, setMailing] = useState(false);

  // Demo reports are built in the browser from hardcoded fixtures: no account,
  // no network, no database. That is what keeps the stage demo safe.
  const demo = demoScanRow(id);

  const {
    data: fetched,
    isPending,
    error,
  } = useQuery({
    queryKey: ["scan", id],
    queryFn: () => getScan(id),
    enabled: !demo,
  });

  const data = demo ?? fetched;

  useEffect(() => {
    if (!data?.image_url) return;
    // Demo images are bundled assets; real ones need a short-lived signed URL.
    if (demo) {
      setImageUrl(data.image_url);
      return;
    }
    void signedImageUrl(data.image_url).then(setImageUrl);
  }, [data?.image_url, demo]);

  async function persist(fields: FieldResult[], verdict: Verdict) {
    try {
      await updateScanFields(id, fields, verdict);
      toast.success("Correction saved — verdict updated.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save the correction.");
    }
  }

  function shareUrl() {
    return typeof window === "undefined" ? "" : `${window.location.origin}/report/${id}`;
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(shareUrl());
      setCopied(true);
      toast.success("Share link copied — anyone with it can open this report.");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Could not copy the link.");
    }
  }

  async function sendMail(e: React.FormEvent) {
    e.preventDefault();
    if (!session?.access_token) return;
    setMailing(true);
    try {
      await emailReport({
        data: {
          accessToken: session.access_token,
          scanId: id,
          to: mailTo.trim(),
          note: mailNote.trim() || undefined,
          origin: window.location.origin,
        },
      });
      toast.success(`Report e-mailed to ${mailTo.trim()}.`);
      setMailOpen(false);
      setMailTo("");
      setMailNote("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not send the e-mail.");
    } finally {
      setMailing(false);
    }
  }

  async function exportPdf() {
    if (!data) return;
    setExporting(true);
    try {
      const fields = normaliseFields(data.field_results);
      const quality = estimateOcrQuality(data.extracted_text);
      const report = finaliseReport(fields, quality);
      await downloadReportPdf({
        id: data.id,
        productName: data.product_name,
        verdict: report.verdict,
        fields: report.fields,
        rawText: data.extracted_text,
        createdAt: data.created_at,
        source: data.source,
        language: data.language,
        imageUrl,
        shareUrl: shareUrl(),
        ocrQuality: quality,
        barcode: data.barcode ?? null,
      });
      toast.success("Report downloaded as a PDF.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not build the PDF.");
    } finally {
      setExporting(false);
    }
  }

  if (!demo && isPending) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="size-6 animate-spin text-primary" />
      </div>
    );
  }

  // Corrections are local-only on a demo, so the "human in the loop" beat
  // still works for a signed-out visitor.
  const isDemo = !!demo;
  const canEdit = isDemo || (!!user && data?.owner_id === user.id);
  // Demo reports can be e-mailed too, but only by a signed-in user.
  const canEmail = !!user && (isDemo || data?.owner_id === user.id);

  if (error || !data) {
    return (
      <div className="mx-auto max-w-xl px-4 py-24 text-center">
        <h1 className="text-2xl font-bold">Report not found</h1>
        <p className="mt-2 text-muted-foreground">
          This inspection no longer exists or the link is incorrect.
        </p>
        <Button asChild className="mt-6">
          <Link to="/scan">Scan a label</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex flex-wrap items-center gap-3">
          <Button asChild variant="ghost" size="sm">
            <Link to="/scan">
              <ArrowLeft className="size-4" /> Back
            </Link>
          </Button>
          <Badge variant="secondary" className="rounded-full">
            {data.source === "demo" ? "Demo label" : "Field scan"}
          </Badge>
          <Badge variant="outline" className="rounded-full">
            {data.language === "hin" ? "हिन्दी" : "English"}
          </Badge>
          <span className="text-xs text-muted-foreground">
            {new Date(data.created_at).toLocaleString("en-IN")}
          </span>
          {isDemo && (
            <Badge variant="outline" className="rounded-full border-accent/40 text-accent">
              Sample report · edits are not saved
            </Badge>
          )}
          {!canEdit && (
            <Badge variant="outline" className="rounded-full text-muted-foreground">
              Shared view · read-only
            </Badge>
          )}
        </div>

        <h1 className="mt-4 text-4xl sm:text-4xl">{data.product_name || "Compliance report"}</h1>
        <p className="mt-2 text-muted-foreground">
          Verified against Rule 6 of the Legal Metrology (Packaged Commodities) Rules, 2011.
        </p>

        <div className="mt-5 flex flex-wrap gap-3">
          <Button onClick={exportPdf} disabled={exporting} className="h-11">
            {exporting ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <FileDown className="size-4" />
            )}
            {exporting ? "Preparing PDF" : "Download PDF report"}
          </Button>
          <Button onClick={copyLink} variant="outline" className="h-11">
            {copied ? <Check className="size-4" /> : <Link2 className="size-4" />}
            {copied ? "Link copied" : "Copy share link"}
          </Button>
          {canEmail && (
            <Button
              onClick={() => setMailOpen((v) => !v)}
              variant="outline"
              className="h-11"
              aria-expanded={mailOpen}
            >
              {mailOpen ? <X className="size-4" /> : <Mail className="size-4" />}
              {mailOpen ? "Close" : "E-mail report"}
            </Button>
          )}
        </div>

        {canEmail && mailOpen && (
          <motion.form
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            onSubmit={sendMail}
            className="mt-4 grid gap-3 rounded-2xl border border-border bg-card p-4 shadow-soft sm:grid-cols-[1fr_1fr_auto]"
          >
            <Input
              type="email"
              required
              placeholder="recipient@example.com"
              value={mailTo}
              onChange={(e) => setMailTo(e.target.value)}
              className="h-11"
              autoFocus
            />
            <Input
              placeholder="Optional note for the recipient"
              value={mailNote}
              onChange={(e) => setMailNote(e.target.value)}
              maxLength={500}
              className="h-11"
            />
            <Button type="submit" className="h-11" disabled={mailing}>
              {mailing ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
              Send
            </Button>
            <p className="text-xs text-muted-foreground sm:col-span-3">
              Sends a branded summary with the verdict, missing declarations and a link to this live
              report. Replies go to your e-mail address.
            </p>
          </motion.form>
        )}
      </motion.div>

      <div className="mt-10">
        <ReportView
          fields={data.field_results}
          rawText={data.extracted_text}
          imageUrl={imageUrl}
          ocrQuality={estimateOcrQuality(data.extracted_text)}
          onFieldsChange={isDemo ? undefined : persist}
          readOnly={!canEdit}
          barcode={data.barcode ?? null}
        />
      </div>

      <div className="mt-10 flex flex-wrap gap-3">
        <Button asChild size="lg" className="h-12 px-6">
          <Link to="/scan">
            <ScanLine className="size-5" /> Scan another
          </Link>
        </Button>
        <Button asChild size="lg" variant="outline" className="h-12 px-6">
          <Link to="/history">
            <History className="size-5" /> View history
          </Link>
        </Button>
      </div>
    </div>
  );
}
