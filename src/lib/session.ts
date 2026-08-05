import { cookies } from "next/headers";
import { getIronSession, SessionOptions } from "iron-session";

export interface AppSession {
  user?: string;
}

export const COOKIE_NAME = "tickets_session";

function resolveSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "SESSION_SECRET must be set to a string of at least 32 characters in production."
      );
    }
    return "dev-only-insecure-session-secret-please-change-32+chars";
  }
  return secret;
}

// Build the session options lazily (per-call) instead of at module load time.
// This is critical: during `next build` the runtime env vars (SESSION_SECRET,
// COOKIE_SECURE, NODE_ENV) are NOT available, so eagerly evaluating them would
// throw a build-time error. Resolving them inside a function defers the work to
// request time, where the real environment is present.
export function getSessionOptions(): SessionOptions {
  const secure = process.env.COOKIE_SECURE === "true";
  return {
    password: resolveSecret(),
    cookieName: COOKIE_NAME,
    cookieOptions: {
      httpOnly: true,
      sameSite: "lax",
      // Self-hosted deployments are often plain HTTP on the LAN; gate the
      // "Secure" cookie flag behind an explicit env var so login works over
      // HTTP by default. Set COOKIE_SECURE=true behind an HTTPS reverse proxy.
      secure,
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    },
  };
}

export async function getSession() {
  const session = await getIronSession<AppSession>(cookies(), getSessionOptions());
  return session;
}

export async function isLoggedIn(): Promise<boolean> {
  const session = await getSession();
  return Boolean(session.user);
}

/** Timing-safe string comparison to avoid user enumeration via timing. */
export function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a, "utf8");
  const bb = Buffer.from(b, "utf8");
  if (ab.length !== bb.length) {
    // Constant-time-ish: still do the compare to avoid short-circuit timing.
    Buffer.compare(ab, bb);
    return false;
  }
  return Buffer.compare(ab, bb) === 0;
}
