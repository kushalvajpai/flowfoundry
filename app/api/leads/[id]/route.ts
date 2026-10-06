import { NextRequest, NextResponse } from "next/server";
import { leadDbService } from "@/lib/services/lead-db-service";
import { verifySessionFromRequest } from "@/lib/auth/session";
import type { LeadStatus } from "@/types/lead";

export const dynamic = "force-dynamic";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  // Defense-in-depth session authorization check
  const session = await verifySessionFromRequest(req);
  if (!session) {
    return NextResponse.json(
      {
        success: false,
        error: "Unauthorized: Active administrative session required",
      },
      {
        status: 401,
        headers: { "WWW-Authenticate": 'Bearer realm="FlowFoundry Internal"' },
      }
    );
  }

  try {
    const { id } = await context.params;

    if (!id || !UUID_REGEX.test(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid lead identifier format" },
        { status: 400 }
      );
    }

    const result = await leadDbService.getLeadById(id);

    if (!result.success || !result.data) {
      return NextResponse.json(
        { success: false, error: "Lead record not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, lead: result.data },
      {
        status: 200,
        headers: { "Cache-Control": "no-store, max-age=0" },
      }
    );
  } catch (err) {
    console.error("[Lead Detail API] Unexpected GET error:", err);
    return NextResponse.json(
      { success: false, error: "Internal server error retrieving lead" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  // Defense-in-depth session authorization check
  const session = await verifySessionFromRequest(req);
  if (!session) {
    return NextResponse.json(
      {
        success: false,
        error: "Unauthorized: Active administrative session required",
      },
      {
        status: 401,
        headers: { "WWW-Authenticate": 'Bearer realm="FlowFoundry Internal"' },
      }
    );
  }

  try {
    const { id } = await context.params;

    if (!id || !UUID_REGEX.test(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid lead identifier format" },
        { status: 400 }
      );
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { success: false, error: "Malformed JSON payload" },
        { status: 400 }
      );
    }

    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { success: false, error: "Invalid payload format" },
        { status: 400 }
      );
    }

    const { status } = body as Record<string, unknown>;

    const validStatuses: LeadStatus[] = [
      "NEW",
      "CONTACTED",
      "QUALIFIED",
      "MEETING_BOOKED",
      "WON",
      "LOST",
    ];

    if (!status || typeof status !== "string" || !validStatuses.includes(status as LeadStatus)) {
      return NextResponse.json(
        { success: false, error: "Valid status value is required" },
        { status: 400 }
      );
    }

    const updateRes = await leadDbService.updateLead(id, { status: status as LeadStatus });

    if (!updateRes.success) {
      return NextResponse.json(
        { success: false, error: updateRes.error || "Failed to update lead" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Lead status updated to ${status}`,
      lead: updateRes.data,
    });
  } catch (err) {
    console.error("[Lead Detail API] Unexpected PATCH error:", err);
    return NextResponse.json(
      { success: false, error: "Internal server error updating lead" },
      { status: 500 }
    );
  }
}
