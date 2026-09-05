import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { motion } from "motion/react";
import { Loader2, ScanLine, ShieldCheck, ShieldAlert, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { listScans } from "@/lib/scans";
import { RequireAuth, useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/history")({
  head: () => ({
    meta: [
      { title: "Inspection history — LabelCheck" },
      {
        name: "description",
        content:
          "Every label inspection logged with its verdict, timestamp and per-field results — filterable by compliance status.",
      },
      { property: "og:title", content: "Inspection history — LabelCheck" },
      {
        property: "og:description",
        content: "A searchable audit trail of every label compliance scan.",
      },
    ],
  }),
  component: HistoryPage,
});

type Filter = "all" | "compliant" | "non_compliant";

function HistoryPage() {
  return (
    <RequireAuth>
      <HistoryContent />
    </RequireAuth>
  );
}

function HistoryContent() {
  const { user } = useAuth();
  const ownerId = user!.id;
  const [filter, setFilter] = useState<Filter>("all");
  const [q, setQ] = useState("");

  const { data, isPending } = useQuery({
    queryKey: ["scans", ownerId],
    queryFn: () => listScans(ownerId),
  });

  const rows = useMemo(() => {
    const all = data ?? [];
    return all.filter((s) => {
      const matchFilter = filter === "all" || s.verdict === filter;
      const matchQuery =
        !q.trim() ||
        (s.product_name ?? "").toLowerCase().includes(q.toLowerCase()) ||
        s.extracted_text.toLowerCase().includes(q.toLowerCase());
      return matchFilter && matchQuery;
    });
  }, [data, filter, q]);

  const stats = useMemo(() => {
    const all = data ?? [];
    const violations = all.filter((s) => s.verdict !== "compliant").length;

    const tally = new Map<string, { label: string; count: number }>();
    for (const s of all) {
      for (const f of s.field_results ?? []) {
        if (f.critical && !f.found) {
          const entry = tally.get(f.key) ?? { label: f.label, count: 0 };
          entry.count += 1;
          tally.set(f.key, entry);
        }
      }
    }
    const top = [...tally.values()].sort((a, b) => b.count - a.count)[0] ?? null;

    return {
      total: all.length,
      compliant: all.filter((s) => s.verdict === "compliant").length,
      violations,
      rate: all.length ? Math.round((violations / all.length) * 100) : 0,
      top,
    };
  }, [data]);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-4xl sm:text-4xl">Inspection history</h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          Every scan you run is logged under your account with its verdict and full per-field result
          set — the audit trail an enforcement authority needs.
        </p>
      </motion.div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Total inspections", value: String(stats.total), tone: "text-primary" },
          { label: "Compliant", value: String(stats.compliant), tone: "text-success" },
          {
            label: "Non-compliant rate",
            value: `${stats.rate}%`,
            tone: "text-destructive",
          },
          {
            label: "Most common violation",
            value: stats.top ? stats.top.label : "—",
            hint: stats.top
              ? `missing on ${stats.top.count} pack${stats.top.count === 1 ? "" : "s"}`
              : "",
            tone: "text-foreground",
            small: true,
          },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border border-border bg-card p-5 shadow-soft">
            <p
              className={cn(
                "font-display",
                s.tone,
                "small" in s && s.small ? "text-xl leading-tight" : "text-4xl",
              )}
            >
              {s.value}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">{s.label}</p>
            {"hint" in s && s.hint ? (
              <p className="mt-0.5 text-xs text-muted-foreground">{s.hint}</p>
            ) : null}
          </div>
        ))}
      </div>

      <div className="mt-4 rounded-2xl border border-border bg-card px-5 py-4 text-sm text-muted-foreground shadow-soft">
        <span className="font-semibold text-foreground">{stats.total}</span> labels scanned ·{" "}
        <span className="font-semibold text-destructive">{stats.rate}%</span> non-compliant
        {stats.top ? (
          <>
            {" "}
            · most common violation:{" "}
            <span className="font-semibold text-foreground">{stats.top.label}</span>
          </>
        ) : null}
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-3">
        <div className="flex rounded-xl border border-border bg-card p-1">
          {(
            [
              ["all", "All"],
              ["compliant", "Compliant"],
              ["non_compliant", "Non-compliant"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={cn(
                "rounded-lg px-4 py-2 text-sm font-medium transition-colors",
                filter === key
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="relative min-w-56 flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search product or label text"
            className="h-11 pl-9"
          />
        </div>
        <Button asChild className="h-11">
          <Link to="/scan">
            <ScanLine className="size-4" /> New scan
          </Link>
        </Button>
      </div>

      <div className="mt-6 space-y-3">
        {isPending && (
          <div className="flex justify-center py-16">
            <Loader2 className="size-6 animate-spin text-primary" />
          </div>
        )}

        {!isPending && rows.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border bg-card p-14 text-center">
            <p className="font-semibold">No inspections yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Run your first scan — or try a demo label — to populate the log.
            </p>
            <Button asChild className="mt-5">
              <Link to="/scan">Scan a label</Link>
            </Button>
          </div>
        )}

        {rows.map((s, i) => {
          const ok = s.verdict === "compliant";
          const missing = (s.field_results ?? []).filter((f) => f.critical && !f.found).length;
          return (
            <motion.div
              key={s.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.05, 0.4) }}
            >
              <Link
                to="/report/$id"
                params={{ id: s.id }}
                className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4 shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-lift"
              >
                <span
                  className={cn(
                    "flex size-12 shrink-0 items-center justify-center rounded-xl",
                    ok ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive",
                  )}
                >
                  {ok ? <ShieldCheck className="size-6" /> : <ShieldAlert className="size-6" />}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{s.product_name || "Unnamed commodity"}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {new Date(s.created_at).toLocaleString("en-IN")} ·{" "}
                    {s.language === "hin" ? "Hindi" : "English"} ·{" "}
                    {s.source === "demo" ? "demo label" : "field scan"}
                  </p>
                </div>
                <div className="hidden text-right sm:block">
                  {!ok && (
                    <p className="text-xs text-muted-foreground">
                      {missing} declaration{missing === 1 ? "" : "s"} missing
                    </p>
                  )}
                </div>
                <Badge
                  variant="outline"
                  className={cn(
                    "shrink-0",
                    ok
                      ? "border-success/40 text-success"
                      : "border-destructive/40 text-destructive",
                  )}
                >
                  {ok ? "Compliant" : "Non-compliant"}
                </Badge>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
