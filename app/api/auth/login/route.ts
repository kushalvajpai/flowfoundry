import { NextRequest, NextResponse } from "next/server";
import {
  createSessionToken,
  verifyCredentials,
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE_SECONDS,
} from "@/lib/auth/session";

export const dynamic = "force-dynamic";

// Basic in-memory rate limiting tracker (per IP) to throttle brute-force attacks
const loginAttempts = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const record = loginAttempts.get(ip);

  if (!record || now > record.resetAt) {
    loginAttempts.set(ip, { count: 1, resetAt: now + 60 * 1000 }); // 1 min window
    return false;
  }

  record.count++;
  if (record.count > 5) {
    return true; // Limit to 5 attempts per minute
  }

  return false;
}

export async function POST(req: NextRequest) {
  try {
    // 1. IP extraction for brute-force mitigation
    const clientIp =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "127.0.0.1";

    if (isRateLimited(clientIp)) {
      return NextResponse.json(
        {
          success: false,
          error: "Too many authentication attempts. Please wait 60 seconds.",
        },
        { status: 429 }
      );
    }

    // 2. Parse body safely
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid JSON payload" },
        { status: 400 }
      );
    }

    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { success: false, error: "Username and password are required" },
        { status: 400 }
      );
    }

    const { username, password } = body as Record<string, unknown>;

    if (
      typeof username !== "string" ||
      typeof password !== "string" ||
      !username.trim() ||
      !password
    ) {
      return NextResponse.json(
        { success: false, error: "Invalid username or password format" },
        { status: 400 }
      );
    }

    // 3. Constant-time credential verification
    const isValid = verifyCredentials(username, password);

    if (!isValid) {
      // Safe generic failure (never leak if username exists vs password wrong)
      console.warn(`[FlowFoundry Auth] Failed login attempt for user: ${username.trim().slice(0, 20)}`);
      return NextResponse.json(
        { success: false, error: "Invalid username or password" },
        { status: 401 }
      );
    }

    // 4. Issue signed cryptographic session token
    const token = await createSessionToken(username.trim(), "operator");

    const isProduction = process.env.NODE_ENV === "production";
    const secureFlag = isProduction ? "Secure; " : "";

    const response = NextResponse.json(
      {
        success: true,
        message: "Authentication successful",
        user: { username: username.trim(), role: "operator" },
      },
      { status: 200 }
    );

    // Set secure HttpOnly cookie
    response.headers.set(
      "Set-Cookie",
      `${SESSION_COOKIE_NAME}=${token}; Path=/; Max-Age=${SESSION_MAX_AGE_SECONDS}; HttpOnly; ${secureFlag}SameSite=Lax`
    );

    return response;
  } catch (err) {
    console.error("[FlowFoundry Auth] Internal error during login:", err);
    return NextResponse.json(
      { success: false, error: "Authentication service error" },
      { status: 500 }
    );
  }
}
