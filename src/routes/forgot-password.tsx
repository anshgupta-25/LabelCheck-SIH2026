import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { motion } from "motion/react";
import { Loader2, KeyRound, MailCheck, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AuthShell, Field } from "@/components/auth/AuthShell";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({
    meta: [{ title: "Reset your password — LabelCheck" }, { name: "robots", content: "noindex" }],
  }),
  component: ForgotPasswordPage,
});

type Problem =
  { kind: "none" } | { kind: "unconfirmed" } | { kind: "error"; message: string } | null;

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);
  const [problem, setProblem] = useState<Problem>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setProblem(null);
    setPending(true);
    const address = email.trim();

    // Look up the account first so an unregistered address gets a clear answer
    // instead of a "check your inbox" that would never arrive.
    const { data: status, error: lookupError } = await supabase.rpc("account_status", {
      check_email: address,
    });

    if (lookupError) {
      setPending(false);
      setProblem({ kind: "error", message: lookupError.message });
      return;
    }
    if (status === "none") {
      setPending(false);
      setProblem({ kind: "none" });
      return;
    }
    if (status === "unconfirmed") {
      setPending(false);
      setProblem({ kind: "unconfirmed" });
      return;
    }

    const { error } = await supabase.auth.resetPasswordForEmail(address, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setPending(false);
    if (error) {
      setProblem({ kind: "error", message: error.message });
      toast.error(error.message);
      return;
    }
    setSent(true);
  }

  if (sent) {
    return (
      <AuthShell
        title="Check your inbox"
        subtitle={`A reset link is on its way to ${email.trim()}.`}
        footer={
          <>
            Remembered it?{" "}
            <Link to="/login" className="font-medium text-primary hover:underline">
              Back to log in
            </Link>
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
          Open the link in that e-mail and you'll land straight on a page where you can set a new
          password. The link is valid for one hour. Nothing arrived? Check spam, or{" "}
          <button
            type="button"
            onClick={() => setSent(false)}
            className="font-medium text-primary hover:underline"
          >
            try another address
          </button>
          .
        </motion.div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Forgot your password?"
      subtitle="Enter the e-mail you signed up with and we'll send a link to set a new one."
      footer={
        <>
          Remembered it?{" "}
          <Link to="/login" className="font-medium text-primary hover:underline">
            Back to log in
          </Link>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4">
        <Field label="E-mail">
          <Input
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setProblem(null);
            }}
            placeholder="you@example.com"
            className="h-12"
          />
        </Field>

        {problem?.kind === "none" && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border border-destructive/30 bg-destructive/10 p-4"
          >
            <p className="text-sm font-semibold text-destructive">No account uses this e-mail</p>
            <p className="mt-1 text-sm text-muted-foreground">
              There's no LabelCheck account for {email.trim()}. Create one first — it takes a
              moment.
            </p>
            <Button asChild variant="outline" className="mt-3 h-10 w-full">
              <Link to="/signup" search={{ next: undefined }}>
                <UserPlus className="size-4" /> Sign up instead
              </Link>
            </Button>
          </motion.div>
        )}

        {problem?.kind === "unconfirmed" && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border border-warning/40 bg-warning/10 p-4"
          >
            <p className="text-sm font-semibold text-foreground">Finish signing up first</p>
            <p className="mt-1 text-sm text-muted-foreground">
              This address was registered but never confirmed, so there's no password to reset yet.
              Sign up again to get a fresh confirmation code.
            </p>
            <Button asChild variant="outline" className="mt-3 h-10 w-full">
              <Link to="/signup" search={{ next: undefined }}>
                <UserPlus className="size-4" /> Go to sign up
              </Link>
            </Button>
          </motion.div>
        )}

        {problem?.kind === "error" && (
          <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {problem.message}
          </p>
        )}

        <Button type="submit" className="h-12 w-full text-base" disabled={pending}>
          {pending ? <Loader2 className="size-5 animate-spin" /> : <KeyRound className="size-5" />}
          Send reset link
        </Button>
      </form>
    </AuthShell>
  );
}
