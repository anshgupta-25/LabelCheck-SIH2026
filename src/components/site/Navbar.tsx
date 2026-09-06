import { Link, useNavigate } from "@tanstack/react-router";
import { motion, AnimatePresence } from "motion/react";
import { useState } from "react";
import { Menu, X, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth, displayName } from "@/lib/auth";
import { BrandMark } from "@/components/site/BrandMark";

const NAV = [
  { to: "/", label: "Home" },
  { to: "/scan", label: "Scan" },
  { to: "/history", label: "History" },
  { to: "/how-it-works", label: "How it works" },
  { to: "/pitch", label: "Pitch" },
] as const;

export function Navbar() {
  const [open, setOpen] = useState(false);
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();

  async function handleSignOut() {
    setOpen(false);
    await signOut();
    void navigate({ to: "/" });
  }

  const name = displayName(user);
  const initial = name.charAt(0).toUpperCase();

  return (
    <header className="sticky top-0 z-50 border-b border-border/70 bg-background/80 backdrop-blur-xl">
      <nav className="mx-auto flex h-16 w-full max-w-6xl items-center gap-3 px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2.5" onClick={() => setOpen(false)}>
          <BrandMark className="size-9 shrink-0" />
          <span className="font-display text-lg font-bold tracking-tight">
            Label<span className="text-primary">Check</span>
          </span>
        </Link>

        <div className="ml-6 hidden items-center gap-1 md:flex">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              activeProps={{ className: "bg-primary-soft text-primary" }}
              activeOptions={{ exact: item.to === "/" }}
            >
              {item.label}
            </Link>
          ))}
        </div>

        {/* desktop right side */}
        <div className="ml-auto hidden items-center gap-2 md:flex">
          {loading ? null : user ? (
            <>
              <span
                className="inline-flex items-center gap-2 rounded-full border border-border bg-card py-1 pl-1 pr-3 text-sm"
                title={user.email ?? ""}
              >
                <span className="bg-primary-gradient flex size-7 items-center justify-center rounded-full text-xs font-bold text-primary-foreground">
                  {initial}
                </span>
                <span className="max-w-[10rem] truncate">{name}</span>
              </span>
              <Button variant="ghost" size="sm" onClick={handleSignOut} aria-label="Sign out">
                <LogOut className="size-4" />
                Sign out
              </Button>
              <Button asChild size="sm">
                <Link to="/scan">Scan a Label</Link>
              </Button>
            </>
          ) : (
            <>
              <Button asChild variant="outline" size="sm">
                <Link to="/login">Log in</Link>
              </Button>
              <Button asChild size="sm">
                <Link to="/signup">Sign up</Link>
              </Button>
            </>
          )}
        </div>

        <button
          className="ml-auto inline-flex size-10 items-center justify-center rounded-lg border border-border md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Close menu" : "Open menu"}
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </nav>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="overflow-hidden border-t border-border bg-background md:hidden"
          >
            <div className="flex flex-col gap-1 px-4 py-3">
              {NAV.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-3 py-3 text-base font-medium text-muted-foreground hover:bg-secondary hover:text-foreground"
                  activeProps={{ className: "bg-primary-soft text-primary" }}
                  activeOptions={{ exact: item.to === "/" }}
                >
                  {item.label}
                </Link>
              ))}
              {user ? (
                <>
                  <div className="mt-2 flex items-center gap-3 rounded-xl border border-border bg-card px-3 py-2">
                    <span className="bg-primary-gradient flex size-8 items-center justify-center rounded-full text-sm font-bold text-primary-foreground">
                      {initial}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{name}</p>
                      <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                    </div>
                  </div>
                  <Button asChild className="mt-2 h-12">
                    <Link to="/scan" onClick={() => setOpen(false)}>
                      Scan a Label
                    </Link>
                  </Button>
                  <Button variant="ghost" className="h-12" onClick={handleSignOut}>
                    <LogOut className="size-4" /> Sign out
                  </Button>
                </>
              ) : (
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <Button asChild variant="outline" className="h-12">
                    <Link to="/login" onClick={() => setOpen(false)}>
                      Log in
                    </Link>
                  </Button>
                  <Button asChild className="h-12">
                    <Link to="/signup" onClick={() => setOpen(false)}>
                      Sign up
                    </Link>
                  </Button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
