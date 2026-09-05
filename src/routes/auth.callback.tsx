import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { safeNext } from "@/components/auth/AuthShell";
import { supabase } from "@/integrations/supabase/client";

/**
 * Landing spot for OAuth and e-mail-confirmation redirects. The Supabase
 * client exchanges the code in the URL on initialisation; we just wait for
 * the session to appear and then continue to `next`.
 */
export const Route = createFileRoute("/auth/callback")({
  validateSearch: (search: Record<string, unknown>): { next?: string | undefined } => ({
    next: typeof search["next"] === "string" ? search["next"] : undefined,
  }),
  head: () => ({
    meta: [{ title: "Signing you in — LabelCheck" }, { name: "robots", content: "noindex" }],
  }),
  component: CallbackPage,
});

function CallbackPage() {
  const { next: rawNext } = Route.useSearch();
  const navigate = useNavigate();

  useEffect(() => {
    const next = safeNext(rawNext);
    const params = new URLSearchParams(window.location.search);
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const problem = params.get("error_description") ?? hash.get("error_description");
    if (problem) {
      toast.error(problem.replace(/\+/g, " "));
      void navigate({ to: "/login", search: { next }, replace: true });
      return;
    }

    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      void navigate({ href: next, replace: true });
    };

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) finish();
    });
    void supabase.auth.getSession().then(({ data }) => {
      if (data.session) finish();
    });
    const timeout = setTimeout(() => {
      if (done) return;
      done = true;
      toast.error("Sign-in did not complete. Please try again.");
      void navigate({ to: "/login", search: { next }, replace: true });
    }, 10_000);

    return () => {
      sub.subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, [rawNext, navigate]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-sm text-muted-foreground">
      <Loader2 className="size-6 animate-spin text-primary" />
      Signing you in…
    </div>
  );
}
