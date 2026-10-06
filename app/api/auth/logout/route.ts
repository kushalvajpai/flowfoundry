import { NextResponse } from "next/server";
import { SESSION_COOKIE_NAME } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export async function POST() {
  const isProduction = process.env.NODE_ENV === "production";
  const secureFlag = isProduction ? "Secure; " : "";

  const response = NextResponse.json(
    { success: true, message: "Logged out successfully" },
    { status: 200 }
  );

  // Clear cookie immediately
  response.headers.set(
    "Set-Cookie",
    `${SESSION_COOKIE_NAME}=; Path=/; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; ${secureFlag}SameSite=Lax`
  );

  return response;
}
