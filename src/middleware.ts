import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getIronSession } from "iron-session";
import { getSessionOptions, AppSession } from "@/lib/session";

// NOTE: getSessionOptions() reads env vars lazily (at request time), so it is
// safe to call here even though middleware runs in the edge runtime.

// Routes that don't require authentication.
const PUBLIC_PATHS = ["/login"];
const PUBLIC_PREFIXES = ["/api/login", "/_next", "/favicon"];

function isPublic(pathname: string): boolean {
  if (PUBLIC_PATHS.includes(pathname)) return true;
  return PUBLIC_PREFIXES.some((p) => pathname.startsWith(p));
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (isPublic(pathname)) {
    return NextResponse.next();
  }

  // Read session from the request cookie without touching next/headers
  // (not available in middleware runtime).
  const res = NextResponse.next();
  const session = await getIronSession<AppSession>(
    req,
    res,
    getSessionOptions()
  );

  if (!session.user) {
    // For API routes, return JSON 401; for pages, redirect to /login.
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return res;
}

export const config = {
  // Protect everything except Next internals and static assets.
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
