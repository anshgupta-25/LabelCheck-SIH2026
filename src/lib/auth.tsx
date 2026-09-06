/**
 * Auth state for the whole app, backed by Supabase Auth.
 *
 * - `AuthProvider` subscribes once to the session and exposes it via context.
 * - `useAuth()` reads it anywhere.
 * - `RequireAuth` wraps pages that need a signed-in user and bounces to
 *   /login (remembering where the user was heading) when there is none.
 *
 * Sessions live in the browser only; during SSR everything renders as
 * "loading" and the client takes over on hydration.
 */
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { useLocation, useNavigate } from "@tanstack/react-router";
import { safeNext } from "@/lib/auth-next";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { sendWelcomeEmail } from "@/lib/email.functions";

interface AuthState {
  user: User | null;
  session: Session | null;
  /** True until the first session lookup resolves on the client. */
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const welcomed = useRef<string | null>(null);

  // First time we see a signed-in user who hasn't had the welcome mail, send it
  // (server-side, via Resend) and remember that on the account.
  useEffect(() => {
    const u = session?.user;
    if (!u || !session?.access_token) return;
    const meta = (u.user_metadata ?? {}) as { welcome_sent?: boolean };
    if (meta.welcome_sent || welcomed.current === u.id) return;
    welcomed.current = u.id;
    void sendWelcomeEmail({
      data: { accessToken: session.access_token, origin: window.location.origin },
    })
      .then((r) => {
        if (r.sent || r.reason === "already sent") {
          return supabase.auth.updateUser({ data: { welcome_sent: true } });
        }
        return undefined;
      })
      .catch((e: unknown) => console.warn("[LabelCheck] welcome e-mail skipped:", e));
  }, [session]);

  useEffect(() => {
    let active = true;
    void supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      setLoading(false);
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AuthState>(
    () => ({
      user: session?.user ?? null,
      session,
      loading,
      signOut: async () => {
        await supabase.auth.signOut();
      },
    }),
    [session, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}

/** Friendly display name: profile name → e-mail local part → "Inspector". */
export function displayName(user: User | null | undefined): string {
  if (!user) return "Inspector";
  const meta = user.user_metadata as { full_name?: string; name?: string } | undefined;
  return meta?.full_name || meta?.name || user.email?.split("@")[0] || "Inspector";
}

export function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Where to return to after signing in, captured while the user is still on
  // the protected page. This must NOT be read from location.href inside the
  // redirect effect: once the redirect lands, href is the login URL, and
  // feeding that back in re-fires the effect and nests
  // /login?next=/login?next=… until React aborts with "maximum update depth".
  const target = useRef(location.href);
  useEffect(() => {
    if (user) target.current = location.href;
  }, [user, location.href]);

  useEffect(() => {
    if (loading || user) return;
    void navigate({
      to: "/login",
      search: { next: safeNext(target.current, "") || undefined },
      replace: true,
    });
  }, [loading, user, navigate]);

  if (loading || !user) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="size-6 animate-spin text-primary" />
      </div>
    );
  }
  return <>{children}</>;
}
