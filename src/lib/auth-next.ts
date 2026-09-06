/**
 * Where to send a user after they authenticate.
 *
 * Lives apart from AuthShell because both the auth screens and RequireAuth
 * need it, and because a module of plain functions keeps fast refresh working
 * in the component file it used to sit in.
 */

/** Auth screens themselves are never a sensible destination. */
const AUTH_PATHS = ["/login", "/signup", "/auth/", "/forgot-password", "/reset-password"];

/**
 * Only same-origin paths are honoured, and never an auth page — otherwise
 * `next` nests into itself on every hop and the URL grows without bound.
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
