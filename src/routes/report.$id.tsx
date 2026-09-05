import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { ArrowLeft, ScanLine, Loader2, History, FileDown, Link2, Check } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ReportView } from "@/components/report/ReportView";
import { getScan, signedImageUrl, updateScanFields } from "@/lib/scans";
import { downloadReportPdf } from "@/lib/report-pdf";
import { useAuth } from "@/lib/auth";
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
  const { user } = useAuth();

  const { data, isPending, error } = useQuery({
    queryKey: ["scan", id],
    queryFn: () => getScan(id),
  });

  useEffect(() => {
    if (data?.image_url) void signedImageUrl(data.image_url).then(setImageUrl);
  }, [data?.image_url]);

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
      });
      toast.success("Report downloaded as a PDF.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not build the PDF.");
    } finally {
      setExporting(false);
    }
  }

  if (isPending) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="size-6 animate-spin text-primary" />
      </div>
    );
  }

  const canEdit = !!user && data?.owner_id === user.id;

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
        </div>
      </motion.div>

      <div className="mt-10">
        <ReportView
          fields={data.field_results}
          rawText={data.extracted_text}
          imageUrl={imageUrl}
          ocrQuality={estimateOcrQuality(data.extracted_text)}
          onFieldsChange={persist}
          readOnly={!canEdit}
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
