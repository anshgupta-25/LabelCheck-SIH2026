import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Loader2, UserPlus, MailCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AuthShell, GoogleButton, OrDivider, Field, safeNext } from "@/components/auth/AuthShell";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/signup")({
  validateSearch: (search: Record<string, unknown>): { next?: string | undefined } => ({
    next: typeof search["next"] === "string" ? search["next"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Create an account — LabelCheck" },
      {
        name: "description",
        content:
          "Create a LabelCheck account to scan labels and keep an audit trail of inspections.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SignupPage,
});

function SignupPage() {
  const { next: rawNext } = Route.useSearch();
  const next = safeNext(rawNext);
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [awaitingConfirm, setAwaitingConfirm] = useState(false);

  useEffect(() => {
    if (!loading && user && !awaitingConfirm) void navigate({ href: next, replace: true });
  }, [loading, user, next, navigate, awaitingConfirm]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: { full_name: name.trim() },
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });
    setPending(false);
    if (error) {
      setError(error.message);
      toast.error(error.message);
      return;
    }
    // Supabase returns a user with no identities when the e-mail already exists.
    if (data.user && data.user.identities && data.user.identities.length === 0) {
      const msg = "An account with this e-mail already exists — log in instead.";
      setError(msg);
      return;
    }
    if (data.session) {
      toast.success("Account created. You're in.");
      void navigate({ href: next, replace: true });
    } else {
      // E-mail confirmation is switched on for this project.
      setAwaitingConfirm(true);
    }
  }

  if (awaitingConfirm) {
    return (
      <AuthShell
        title="Check your inbox"
        subtitle={`We sent a confirmation link to ${email.trim()}.`}
        footer={
          <>
            Wrong address?{" "}
            <button
              type="button"
              onClick={() => setAwaitingConfirm(false)}
              className="font-medium text-primary hover:underline"
            >
              Go back
            </button>
          </>
        }
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-2xl border border-border bg-card p-6 text-sm leading-relaxed text-muted-foreground shadow-soft"
        >
          <span className="bg-primary-gradient mb-4 flex size-11 items-center justify-center rounded-xl text-primary-foreground">
            <MailCheck className="size-5" />
          </span>
          Open the link in that e-mail to activate your account. It brings you straight back here
          and signs you in. If it hasn't arrived in a minute, check your spam folder.
        </motion.div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Create your account"
      subtitle="Every scan you run is logged under your name, ready to export or share."
      footer={
        <>
          Already have an account?{" "}
          <Link
            to="/login"
            search={{ next: rawNext }}
            className="font-medium text-primary hover:underline"
          >
            Log in
          </Link>
        </>
      }
    >
      <GoogleButton next={next} label="Sign up with Google" />
      <OrDivider />

      <form onSubmit={submit} className="space-y-4">
        <Field label="Full name">
          <Input
            autoComplete="name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ansh Gupta"
            className="h-12"
          />
        </Field>
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
        <Field label="Password" hint="at least 8 characters">
          <Input
            type="password"
            autoComplete="new-password"
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
          {pending ? <Loader2 className="size-5 animate-spin" /> : <UserPlus className="size-5" />}
          Create account
        </Button>
        <p className="text-center text-xs leading-relaxed text-muted-foreground">
          By continuing you agree that inspection records you create are stored under your account
          for audit purposes.
        </p>
      </form>
    </AuthShell>
  );
}
