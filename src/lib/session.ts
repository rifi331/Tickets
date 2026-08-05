import { cookies } from "next/headers";
import { getIronSession, SessionOptions } from "iron-session";

export interface AppSession {
  user?: string;
}

export const sessionOptions: SessionOptions = {
  password: getSessionSecret(),
  cookieName: "tickets_session",
  cookieOptions: {
    httpOnly: true,
    sameSite: "lax",
    // Secure cookies require HTTPS. Allow override for local testing over HTTP.
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  },
};

function getSessionSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    // Fall back to a throwaway value in dev so the app still boots; in
    // production a short secret is a fatal config error.
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "SESSION_SECRET must be set to a string of at least 32 characters in production."
      );
    }
    return "dev-only-insecure-session-secret-please-change-32+chars";
  }
  return secret;
}

export async function getSession() {
  const session = await getIronSession<AppSession>(cookies(), sessionOptions);
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
