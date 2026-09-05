import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, ShieldCheck, KeyRound } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AuthShell, Field } from "@/components/auth/AuthShell";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [{ title: "Choose a new password — LabelCheck" }, { name: "robots", content: "noindex" }],
  }),
  component: ResetPasswordPage,
});

/**
 * Target of the password-reset e-mail. Supabase puts a one-time code in the
 * URL; the client exchanges it for a recovery session on load, after which
 * `updateUser` may set a new password.
 */
function ResetPasswordPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [pending, setPending] = useState(false);
  const [expired, setExpired] = useState(false);
  const [otpEmail, setOtpEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    const problem = new URLSearchParams(window.location.search).get("error_description");
    if (problem) {
      toast.error(problem.replace(/\+/g, " "));
      setExpired(true);
      return;
    }
    // Give the code exchange a moment; if no session appears, the link is stale.
    const t = setTimeout(() => {
      if (!user) setExpired(true);
    }, 8000);
    return () => clearTimeout(t);
  }, [user]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      toast.error("The two passwords don't match.");
      return;
    }
    setPending(true);
    const { error } = await supabase.auth.updateUser({ password });
    setPending(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Password updated. You're signed in.");
    void navigate({ to: "/scan", replace: true });
  }

  async function verifyCode(e: React.FormEvent) {
    e.preventDefault();
    setVerifying(true);
    const { error } = await supabase.auth.verifyOtp({
      email: otpEmail.trim(),
      token: otp.trim(),
      type: "recovery",
    });
    setVerifying(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    // Session is now set; the password form renders on the next paint.
  }

  if (!user) {
    const waiting = !expired;
    return (
      <AuthShell
        title={waiting ? "Checking your link…" : "Enter your code"}
        subtitle={
          waiting
            ? "One moment. If you came from the reset e-mail, this takes a second."
            : "The link didn't verify — it may have been used already. Type the six-digit code from the e-mail instead, or request a new one."
        }
        footer={
          <>
            Need a fresh e-mail?{" "}
            <Link to="/forgot-password" className="font-medium text-primary hover:underline">
              Request a new link
            </Link>
          </>
        }
      >
        {waiting && (
          <div className="mb-6 flex items-center justify-center">
            <Loader2 className="size-6 animate-spin text-primary" />
          </div>
        )}
        <form onSubmit={verifyCode} className="space-y-4">
          <Field label="E-mail">
            <Input
              type="email"
              autoComplete="email"
              required
              value={otpEmail}
              onChange={(e) => setOtpEmail(e.target.value)}
              placeholder="you@example.com"
              className="h-12"
            />
          </Field>
          <Field label="Six-digit code" hint="from the reset e-mail">
            <Input
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]{6}"
              maxLength={6}
              required
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
              placeholder="482913"
              className="h-12 font-mono text-lg tracking-[0.3em]"
            />
          </Field>
          <Button
            type="submit"
            variant={waiting ? "outline" : "default"}
            className="h-12 w-full text-base"
            disabled={verifying}
          >
            {verifying ? (
              <Loader2 className="size-5 animate-spin" />
            ) : (
              <KeyRound className="size-5" />
            )}
            Verify code
          </Button>
        </form>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Choose a new password"
      subtitle={`Signed in as ${user.email ?? "your account"}. Pick something you haven't used before.`}
      footer={<span>{loading ? "" : "You'll be taken to the scanner once it's saved."}</span>}
    >
      <form onSubmit={submit} className="space-y-4">
        <Field label="New password" hint="at least 8 characters">
          <Input
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-12"
          />
        </Field>
        <Field label="Confirm new password">
          <Input
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="h-12"
          />
        </Field>
        <Button type="submit" className="h-12 w-full text-base" disabled={pending}>
          {pending ? (
            <Loader2 className="size-5 animate-spin" />
          ) : (
            <ShieldCheck className="size-5" />
          )}
          Save new password
        </Button>
      </form>
    </AuthShell>
  );
}
