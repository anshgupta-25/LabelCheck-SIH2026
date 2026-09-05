import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { motion } from "motion/react";
import { Loader2, KeyRound, MailCheck } from "lucide-react";
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

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setPending(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setSent(true);
  }

  if (sent) {
    return (
      <AuthShell
        title="Check your inbox"
        subtitle={`If an account exists for ${email.trim()}, a reset link is on its way.`}
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
          Open the link in that e-mail to choose a new password. It's valid for one hour. Nothing
          arrived? Check spam, or{" "}
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
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="h-12"
          />
        </Field>
        <Button type="submit" className="h-12 w-full text-base" disabled={pending}>
          {pending ? <Loader2 className="size-5 animate-spin" /> : <KeyRound className="size-5" />}
          Send reset link
        </Button>
      </form>
    </AuthShell>
  );
}
