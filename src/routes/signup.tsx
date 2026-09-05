import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { Loader2, UserPlus, ShieldCheck, ArrowLeft } from "lucide-react";
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

// Supabase enforces a 60s cooldown between resends; match it so the
// button never fires into a 429.
const RESEND_COOLDOWN = 60;

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

  // Second step: the six-digit code from the confirmation e-mail.
  const [awaitingCode, setAwaitingCode] = useState(false);
  const [code, setCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const codeRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!loading && user && !awaitingCode) void navigate({ href: next, replace: true });
  }, [loading, user, next, navigate, awaitingCode]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  useEffect(() => {
    if (awaitingCode) codeRef.current?.focus();
  }, [awaitingCode]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);

    const address = email.trim();
    // Tell someone who already has an account to log in, rather than sending
    // them a confirmation mail that will never make sense.
    const { data: status } = await supabase.rpc("account_status", { check_email: address });
    if (status === "active") {
      setPending(false);
      setError("An account with this e-mail already exists — log in instead.");
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email: address,
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
    if (data.session) {
      // Confirmation is switched off on this project — straight in.
      toast.success("Account created. You're in.");
      void navigate({ href: next, replace: true });
      return;
    }
    setAwaitingCode(true);
    setCooldown(RESEND_COOLDOWN);
    toast.success(`We sent a six-digit code to ${address}.`);
  }

  async function verify(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setVerifying(true);
    const { error } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token: code.trim(),
      type: "signup",
    });
    setVerifying(false);
    if (error) {
      const msg = /expired|invalid/i.test(error.message)
        ? "That code is wrong or has expired. Check the latest e-mail, or send a new code."
        : error.message;
      setError(msg);
      return;
    }
    // Session is live now; AuthProvider sends the welcome e-mail and the
    // redirect below takes over.
    toast.success("E-mail confirmed. Welcome to LabelCheck.");
    setAwaitingCode(false);
    void navigate({ href: next, replace: true });
  }

  async function resend() {
    setError(null);
    const { error } = await supabase.auth.resend({ type: "signup", email: email.trim() });
    if (error) {
      const tooSoon = /rate|429|only request this after/i.test(error.message);
      toast.error(tooSoon ? "Please wait a minute before asking for another code." : error.message);
      if (tooSoon) setCooldown(RESEND_COOLDOWN);
      return;
    }
    setCooldown(RESEND_COOLDOWN);
    toast.success("A new code is on its way.");
  }

  /* ----------------------------- code step ----------------------------- */

  if (awaitingCode) {
    return (
      <AuthShell
        title="Enter your code"
        subtitle={`We sent a six-digit confirmation code to ${email.trim()}.`}
        footer={
          <button
            type="button"
            onClick={() => {
              setAwaitingCode(false);
              setCode("");
              setError(null);
            }}
            className="inline-flex items-center gap-1.5 font-medium text-primary hover:underline"
          >
            <ArrowLeft className="size-3.5" /> Use a different e-mail
          </button>
        }
      >
        <motion.form
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={verify}
          className="space-y-4"
        >
          <Field label="Confirmation code" hint="from the e-mail we just sent">
            <Input
              ref={codeRef}
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]{6,8}"
              maxLength={8}
              required
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              placeholder="482913"
              className="h-14 text-center font-mono text-2xl tracking-[0.4em]"
            />
          </Field>

          {error && (
            <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}

          <Button
            type="submit"
            className="h-12 w-full text-base"
            disabled={verifying || code.length < 6}
          >
            {verifying ? (
              <Loader2 className="size-5 animate-spin" />
            ) : (
              <ShieldCheck className="size-5" />
            )}
            Confirm and continue
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            Didn't get it?{" "}
            {cooldown > 0 ? (
              <span>Send another in {cooldown}s</span>
            ) : (
              <button
                type="button"
                onClick={resend}
                className="font-medium text-primary hover:underline"
              >
                Send a new code
              </button>
            )}
          </p>
        </motion.form>
      </AuthShell>
    );
  }

  /* ---------------------------- details step ---------------------------- */

  return (
    <AuthShell
      title="Create your account"
      subtitle="Every scan you run is logged under your name, ready to export or share."
      footer={
        <>
          Already have an account?{" "}
          <Link
            to="/login"
            search={{ next: carryNext(rawNext) }}
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
            onChange={(e) => {
              setEmail(e.target.value);
              setError(null);
            }}
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
          <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
            {error.includes("already exists") && (
              <>
                {" "}
                <Link
                  to="/login"
                  search={{ next: carryNext(rawNext) }}
                  className="font-semibold underline underline-offset-2"
                >
                  Log in
                </Link>
              </>
            )}
          </div>
        )}

        <Button type="submit" className="h-12 w-full text-base" disabled={pending}>
          {pending ? <Loader2 className="size-5 animate-spin" /> : <UserPlus className="size-5" />}
          Create account
        </Button>
        <p className="text-center text-xs leading-relaxed text-muted-foreground">
          We'll e-mail you a six-digit code to confirm the address. Inspection records you create
          are stored under your account for audit purposes.
        </p>
      </form>
    </AuthShell>
  );
}
