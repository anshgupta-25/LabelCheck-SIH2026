import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, LogIn } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AuthShell,
  GoogleButton,
  OrDivider,
  Field,
  safeNext,
  carryNext,
} from "@/components/auth/AuthShell";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/login")({
  validateSearch: (search: Record<string, unknown>): { next?: string | undefined } => ({
    next: typeof search["next"] === "string" ? search["next"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Log in — LabelCheck" },
      {
        name: "description",
        content: "Sign in to LabelCheck to scan labels and see your inspection history.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const { next: rawNext } = Route.useSearch();
  const next = safeNext(rawNext);
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Already signed in → go where they were heading.
  useEffect(() => {
    if (!loading && user) void navigate({ href: next, replace: true });
  }, [loading, user, next, navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setPending(false);
    if (error) {
      const msg = /confirm/i.test(error.message)
        ? "Please confirm your e-mail first — check your inbox for the link."
        : error.message;
      setError(msg);
      toast.error(msg);
      return;
    }
    toast.success("Welcome back.");
    void navigate({ href: next, replace: true });
  }

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to scan labels, run batch checks and open your inspection history."
      footer={
        <>
          New to LabelCheck?{" "}
          <Link
            to="/signup"
            search={{ next: carryNext(rawNext) }}
            className="font-medium text-primary hover:underline"
          >
            Create an account
          </Link>
        </>
      }
    >
      <GoogleButton next={next} label="Continue with Google" />
      <OrDivider />

      <form onSubmit={submit} className="space-y-4">
        <Field label="E-mail">
          <Input
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="h-12"
          />
        </Field>
        <Field
          label="Password"
          hint={
            <Link to="/forgot-password" className="text-primary hover:underline">
              Forgot password?
            </Link>
          }
        >
          <Input
            type="password"
            autoComplete="current-password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="h-12"
          />
        </Field>

        {error && (
          <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        )}

        <Button type="submit" className="h-12 w-full text-base" disabled={pending}>
          {pending ? <Loader2 className="size-5 animate-spin" /> : <LogIn className="size-5" />}
          Log in
        </Button>
      </form>
    </AuthShell>
  );
}
