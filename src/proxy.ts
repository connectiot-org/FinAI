import { NextRequest, NextResponse } from "next/server";

export function proxy(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  // 1. Always allow health check & public static assets
  if (pathname.startsWith("/api/v1/health") || pathname.startsWith("/_next") || pathname.includes(".")) {
    return NextResponse.next();
  }

  // 2. Check for presence of session token cookie
  const sessionCookie =
    req.cookies.get("next-auth.session-token")?.value ||
    req.cookies.get("__Secure-next-auth.session-token")?.value;

  // In production or strict mode, protect /agent if no session and not in dev preview
  const isAgentRoute = pathname.startsWith("/agent");
  const isApiV1Protected =
    pathname.startsWith("/api/v1/") && !pathname.startsWith("/api/v1/health");

  // Allow demo access unless STRICT_AUTH is explicitly enabled
  const isDev = process.env.NODE_ENV === "development";
  const isStrictAuth = process.env.STRICT_AUTH === "true";

  if (!sessionCookie && !isDev && isStrictAuth) {
    if (isAgentRoute) {
      const signInUrl = new URL("/sign-in", req.url);
      signInUrl.searchParams.set("next", pathname + search);
      return NextResponse.redirect(signInUrl);
    }

    if (isApiV1Protected) {
      return NextResponse.json(
        {
          error: {
            code: "UNAUTHORIZED",
            message: "Authentication required for this endpoint",
          },
          requestId: `mw_${Date.now()}`,
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
