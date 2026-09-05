import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, ShieldCheck } from "lucide-react";
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

  if (!user && !expired) {
    return (
      <AuthShell
        title="One moment"
        subtitle="Checking your reset link…"
        footer={
          <Link to="/login" className="font-medium text-primary hover:underline">
            Back to log in
          </Link>
        }
      >
        <div className="flex items-center justify-center py-10">
          <Loader2 className="size-6 animate-spin text-primary" />
        </div>
      </AuthShell>
    );
  }

  if (!user) {
    return (
      <AuthShell
        title="This link has expired"
        subtitle="Reset links work once and for one hour. Request a fresh one and try again."
        footer={
          <Link to="/login" className="font-medium text-primary hover:underline">
            Back to log in
          </Link>
        }
      >
        <Button asChild className="h-12 w-full text-base">
          <Link to="/forgot-password">Request a new link</Link>
        </Button>
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
