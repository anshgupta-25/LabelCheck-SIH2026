/**
 * Token verification for the mail server functions.
 *
 * These cover the path that broke on Node 20: supabase-js threw on
 * construction because realtime-js needs a native WebSocket, so the whole
 * mail flow died before reaching Resend. The path is now two plain fetches,
 * and these tests pin its behaviour without needing a live session.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { userFromToken } from "./email.functions";

const REAL_FETCH = globalThis.fetch;

beforeEach(() => {
  process.env["SUPABASE_URL"] = "https://example.supabase.co";
  process.env["SUPABASE_PUBLISHABLE_KEY"] = "sb_publishable_test";
});

afterEach(() => {
  globalThis.fetch = REAL_FETCH;
  vi.restoreAllMocks();
});

function mockFetch(status: number, body: unknown) {
  const spy = vi.fn(
    async () =>
      new Response(JSON.stringify(body), {
        status,
        headers: { "Content-Type": "application/json" },
      }),
  );
  globalThis.fetch = spy as unknown as typeof fetch;
  return spy;
}

describe("userFromToken", () => {
  it("returns the user and sends the caller's own bearer token", async () => {
    const spy = mockFetch(200, {
      id: "b7a87505-7563-4560-beb9-9fc48dd5d684",
      email: "inspector@example.com",
      user_metadata: { full_name: "An Inspector" },
    });

    const { user, sb } = await userFromToken("a-real-access-token");

    expect(user.id).toBe("b7a87505-7563-4560-beb9-9fc48dd5d684");
    expect(user.email).toBe("inspector@example.com");

    // RLS depends on the caller's token reaching Supabase, not the anon key.
    const [url, init] = spy.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://example.supabase.co/auth/v1/user");
    const headers = init.headers as Record<string, string>;
    expect(headers["Authorization"]).toBe("Bearer a-real-access-token");
    expect(headers["apikey"]).toBe("sb_publishable_test");
    expect(sb.url).toBe("https://example.supabase.co");
  });

  it("rejects a bad token — Supabase answers 403, not 401", async () => {
    mockFetch(403, { message: "invalid claim" });
    await expect(userFromToken("bogus")).rejects.toThrow(/signed in/i);
  });

  it("rejects a response with no user id rather than proceeding unauthenticated", async () => {
    mockFetch(200, {});
    await expect(userFromToken("odd")).rejects.toThrow(/signed in/i);
  });

  it("fails clearly when Supabase is not configured on the server", async () => {
    delete process.env["SUPABASE_URL"];
    delete process.env["VITE_SUPABASE_URL"];
    await expect(userFromToken("x")).rejects.toThrow(/not configured/i);
  });
});
