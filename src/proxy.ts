import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { getAuthSecret } from "./server/env";

/**
 * Edge middleware (Next 16 `proxy` convention).
 *
 * - STRICT_AUTH=true gates /agent and the protected /api/v1/* endpoints behind
 *   a valid session JWT (edge-safe check via next-auth/jwt — no DB access in
 *   the edge runtime). Full identity resolution happens in the route handlers
 *   via requireUser()/getCurrentUser().
 * - Health checks and framework internals always pass through.
 *
 * NOTE: this gate is defense-in-depth. Every protected route handler ALSO
 * enforces authentication server-side, so a bypass of this middleware can
 * never expose data on its own.
 */

export async function proxy(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  // 1. Always allow health checks & framework internals.
  //    Note: `_next` assets are matched precisely — a blanket
  //    `pathname.includes(".")` rule previously allowed any dotted path
  //    (e.g. /agent/x.png) to bypass the gate.
  if (
    pathname.startsWith("/api/v1/health") ||
    pathname.startsWith("/_next/") ||
    pathname === "/favicon.ico" ||
    pathname === "/robots.txt"
  ) {
    return NextResponse.next();
  }

  const isAgentRoute = pathname === "/agent" || pathname.startsWith("/agent/");
  const isProtectedApi =
    pathname.startsWith("/api/v1/") && !pathname.startsWith("/api/v1/health");

  // Nothing else is gated unless strict auth is enabled.
  if (process.env.STRICT_AUTH !== "true") {
    return NextResponse.next();
  }

  if (isAgentRoute || isProtectedApi) {
    // Use the same secret resolution as NextAuth itself (including the
    // development-only fallback) — otherwise a dev session signed with the
    // fallback would be rejected here while being valid on the server.
    const token = await getToken({ req, secret: getAuthSecret() });
    if (!token?.id) {
      if (isAgentRoute) {
        const signInUrl = new URL("/sign-in", req.url);
        signInUrl.searchParams.set("next", pathname + search);
        return NextResponse.redirect(signInUrl);
      }
      return NextResponse.json(
        {
          error: {
            code: "UNAUTHORIZED",
            message: "Authentication required for this endpoint",
          },
        },
        { status: 401 }
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/agent/:path*", "/api/v1/:path*"],
};
