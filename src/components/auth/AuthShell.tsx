/**
 * Split-screen frame for the login / signup pages: the wire globe and a short
 * value statement on the left, the form on the right. Also exports the shared
 * Google button and divider so both pages stay identical.
 */
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { motion } from "motion/react";
import { ScanLine, ShieldCheck, Layers, FileDown, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { WireGlobe } from "@/components/site/WireGlobe";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

const POINTS = [
  { icon: ShieldCheck, text: "Cited Rule 6 verdicts in seconds" },
  { icon: Layers, text: "Batch checks of up to eight labels" },
  { icon: FileDown, text: "Officer-ready PDF reports with a QR link" },
];

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
}) {
  return (
    <div className="grid min-h-[calc(100vh-4rem)] lg:grid-cols-[1.05fr_1fr]">
      {/* ------------------------------ left ------------------------------ */}
      <aside className="bg-hero-gradient relative hidden overflow-hidden border-r border-border lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div
          aria-hidden
          className="bg-grid-paper pointer-events-none absolute inset-0 opacity-60 [mask-image:radial-gradient(80%_70%_at_50%_40%,black,transparent)]"
        />
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative inline-flex w-max items-center gap-2 rounded-full border border-border bg-card/80 px-4 py-1.5 text-xs text-muted-foreground backdrop-blur"
        >
          <span className="animate-blink size-1.5 rounded-full bg-accent" />
          Smart India Hackathon 2026 · SIH26034
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          className="relative"
        >
          <WireGlobe className="mx-auto aspect-square w-full max-w-[22rem]" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          className="relative"
        >
          <h2 className="text-4xl leading-[1.02]">
            Every label,
            <br />
            <span className="italic text-accent">under scrutiny.</span>
          </h2>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
            Sign in to scan labels, run batch checks and keep an audit trail of every inspection
            under your own name.
          </p>
          <ul className="mt-6 space-y-2.5">
            {POINTS.map((p, i) => (
              <motion.li
                key={p.text}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.35 + i * 0.1, duration: 0.4 }}
                className="flex items-center gap-3 text-sm"
              >
                <span className="flex size-8 items-center justify-center rounded-lg border border-border bg-card/80 text-accent shadow-soft">
                  <p.icon className="size-4" />
                </span>
                {p.text}
              </motion.li>
            ))}
          </ul>
        </motion.div>
      </aside>

      {/* ------------------------------ right ----------------------------- */}
      <main className="flex items-center justify-center px-4 py-12 sm:px-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-md"
        >
          <Link to="/" className="inline-flex items-center gap-2.5">
            <span className="bg-primary-gradient flex size-9 items-center justify-center rounded-xl text-primary-foreground shadow-soft">
              <ScanLine className="size-5" />
            </span>
            <span className="font-display text-lg font-bold tracking-tight">
              Label<span className="text-primary">Check</span>
            </span>
          </Link>
          <h1 className="mt-8 text-3xl sm:text-4xl">{title}</h1>
          <p className="mt-2 text-muted-foreground">{subtitle}</p>
          <div className="mt-8">{children}</div>
          <p className="mt-8 text-center text-sm text-muted-foreground">{footer}</p>
        </motion.div>
      </main>
    </div>
  );
}

/** Auth screens themselves are never a sensible destination. */
const AUTH_PATHS = ["/login", "/signup", "/auth/", "/forgot-password", "/reset-password"];

/**
 * Where to send the user after auth. Only same-origin paths are honoured, and
 * never an auth page — otherwise `next` nests into itself on every hop and the
 * URL grows without bound.
 */
export function safeNext(next: string | undefined, fallback = "/scan"): string {
  if (!next || !next.startsWith("/") || next.startsWith("//")) return fallback;
  const path = next.split("?")[0] ?? "";
  if (AUTH_PATHS.some((p) => path === p || path.startsWith(p))) return fallback;
  return next;
}

/** The `next` worth carrying on links between auth pages; undefined when unsafe. */
export function carryNext(next: string | undefined): string | undefined {
  const safe = safeNext(next, "");
  return safe === "" ? undefined : safe;
}

/** The parts of Google Identity Services we rely on. */
interface GoogleIdentity {
  accounts?: {
    id?: {
      initialize: (config: {
        client_id: string;
        callback: (response: { credential?: string }) => void;
        auto_select?: boolean;
        cancel_on_tap_outside?: boolean;
      }) => void;
      renderButton: (
        parent: HTMLElement,
        options: {
          type?: string;
          theme?: string;
          size?: string;
          shape?: string;
          text?: string;
          width?: number;
        },
      ) => void;
    };
  };
}

/**
 * Google sign-in.
 *
 * Preferred path: Google Identity Services renders its own button on *our*
 * origin and hands back an ID token, which Supabase verifies against the
 * client id. The browser never travels to <ref>.supabase.co, so Google's
 * consent UI shows "LabelCheck" and our logo instead of the project id.
 *
 * Fallback: if the Google script is blocked (ad blockers, strict privacy
 * modes) or the token is refused, we drop back to the redirect flow. That
 * always works, it just shows the Supabase domain.
 */
export function GoogleButton({ next, label }: { next: string; label: string }) {
  const clientId = import.meta.env["VITE_GOOGLE_CLIENT_ID"] as string | undefined;
  const navigate = useNavigate();
  const slot = useRef<HTMLDivElement>(null);
  const [pending, setPending] = useState(false);
  const [gisReady, setGisReady] = useState(false);

  /** The original redirect flow, kept as a safety net. */
  const redirectFlow = useCallback(async () => {
    setPending(true);
    const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo, queryParams: { prompt: "select_account" } },
    });
    if (error) {
      const notConfigured = /provider is not enabled|unsupported provider/i.test(error.message);
      toast.error(
        notConfigured
          ? "Google sign-in isn't set up yet — please use your e-mail address for now."
          : error.message,
      );
      setPending(false);
    }
    // On success the browser navigates away to Google.
  }, [next]);

  const onCredential = useCallback(
    async (response: { credential?: string }) => {
      if (!response.credential) return;
      setPending(true);
      const { error } = await supabase.auth.signInWithIdToken({
        provider: "google",
        token: response.credential,
      });
      if (error) {
        // Never dead-end the user: hand them to the flow that always works.
        console.warn("[LabelCheck] ID-token sign-in failed, falling back:", error.message);
        void redirectFlow();
        return;
      }
      await navigate({ href: next, replace: true });
    },
    [navigate, next, redirectFlow],
  );

  useEffect(() => {
    if (!clientId) return;
    let cancelled = false;

    const init = () => {
      const gsi = (window as unknown as { google?: GoogleIdentity }).google;
      const parent = slot.current;
      if (cancelled || !gsi?.accounts?.id || !parent) return;
      try {
        gsi.accounts.id.initialize({
          client_id: clientId,
          callback: (r) => void onCredential(r),
          auto_select: false,
          cancel_on_tap_outside: true,
        });
        parent.replaceChildren();
        gsi.accounts.id.renderButton(parent, {
          type: "standard",
          theme: "outline",
          size: "large",
          shape: "pill",
          text: /sign up/i.test(label) ? "signup_with" : "continue_with",
          width: Math.min(Math.max(parent.offsetWidth || 360, 200), 400),
        });
        setGisReady(true);
      } catch {
        setGisReady(false);
      }
    };

    const existing = document.querySelector<HTMLScriptElement>("script[data-gsi]");
    if (existing) {
      if (existing.dataset["loaded"]) init();
      else existing.addEventListener("load", init, { once: true });
      return () => {
        cancelled = true;
      };
    }

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.dataset["gsi"] = "true";
    script.addEventListener("load", () => {
      script.dataset["loaded"] = "true";
      init();
    });
    // Blocked or offline: the custom button below stays and uses the redirect.
    script.addEventListener("error", () => setGisReady(false));
    document.head.appendChild(script);
    return () => {
      cancelled = true;
    };
  }, [clientId, label, onCredential]);

  return (
    <div className="w-full">
      {/* Google renders its own button here. It must sit on our origin for the
          consent screen to carry our name and logo. */}
      <div
        ref={slot}
        className={cn("flex w-full justify-center", (!gisReady || pending) && "hidden")}
      />
      {(!gisReady || pending) && (
        <Button
          type="button"
          variant="outline"
          className="h-12 w-full gap-3 text-base"
          onClick={redirectFlow}
          disabled={pending}
        >
          {pending ? <Loader2 className="size-5 animate-spin" /> : <GoogleMark />}
          {label}
        </Button>
      )}
    </div>
  );
}

export function OrDivider() {
  return (
    <div className="my-6 flex items-center gap-3 text-xs uppercase tracking-wider text-muted-foreground">
      <span className="h-px flex-1 bg-border" />
      or with e-mail
      <span className="h-px flex-1 bg-border" />
    </div>
  );
}

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: ReactNode;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="flex items-baseline justify-between text-sm font-medium">
        {label}
        {hint ? <span className="text-xs font-normal text-muted-foreground">{hint}</span> : null}
      </span>
      <div className="mt-1.5">{children}</div>
    </label>
  );
}

/* Google's brand mark — brand colours are intentionally literal here. */
function GoogleMark() {
  return (
    <svg viewBox="0 0 48 48" className="size-5" aria-hidden>
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </svg>
  );
}
