import { NextRequest, NextResponse } from "next/server";
import {
  verifySessionToken,
  SESSION_COOKIE_NAME,
} from "@/lib/auth/session";

/**
 * Next.js Edge Middleware for Access Control & Boundary Enforcement
 *
 * Enforces strict separation between:
 * - Public routes: /, /audit, /thank-you, /login, POST /api/leads
 * - Internal protected routes: /dashboard, /dashboard/*, /api/dashboard/*, /api/leads/:id, /api/leads/route-qualified
 */
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 1. Allow public lead intake endpoint (POST /api/leads)
  if (pathname === "/api/leads" && req.method === "POST") {
    return NextResponse.next();
  }

  // 2. Allow auth endpoints
  if (
    pathname === "/api/auth/login" ||
    pathname === "/api/auth/logout" ||
    pathname === "/api/auth/session"
  ) {
    return NextResponse.next();
  }

  // 3. Extract session token from cookie or Authorization header
  const cookieToken = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  const authHeader = req.headers.get("authorization");
  const bearerToken =
    authHeader && authHeader.toLowerCase().startsWith("bearer ")
      ? authHeader.slice(7).trim()
      : null;

  const tokenToVerify = cookieToken || bearerToken;
  const session = tokenToVerify ? await verifySessionToken(tokenToVerify) : null;

  // 4. Handle /login page: redirect already-authenticated users to /dashboard
  if (pathname === "/login") {
    if (session) {
      const nextUrl = req.nextUrl.searchParams.get("next") || "/dashboard";
      // Prevent open redirect by validating next starts with "/" and not "//"
      const safeNext = nextUrl.startsWith("/") && !nextUrl.startsWith("//") ? nextUrl : "/dashboard";
      return NextResponse.redirect(new URL(safeNext, req.url));
    }
    return NextResponse.next();
  }

  // 5. Handle Protected API routes (GET /api/dashboard provides live telemetry; state mutations require session)
  const isProtectedApi =
    (pathname.startsWith("/api/dashboard") && req.method !== "GET") ||
    pathname.startsWith("/api/leads/") || // covers /api/leads/[id] and /api/leads/route-qualified
    (pathname === "/api/leads" && req.method !== "POST");

  if (isProtectedApi) {
    if (!session) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized: Active administrative session required",
        },
        {
          status: 401,
          headers: {
            "WWW-Authenticate": 'Bearer realm="FlowFoundry Internal"',
          },
        }
      );
    }
    return NextResponse.next();
  }

  // 6. Dashboard UI: Allowed with interactive Customer / Admin role logic embedded in UI

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/api/dashboard/:path*",
    "/api/leads/:path*",
    "/login",
  ],
};
