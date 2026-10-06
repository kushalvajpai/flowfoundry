import { NextRequest, NextResponse } from "next/server";
import { dashboardService } from "@/lib/services/dashboard-service";
import { verifySessionFromRequest } from "@/lib/auth/session";
import type { LeadClassification, LeadStatus } from "@/types/lead";

export const dynamic = "force-dynamic";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function GET(req: NextRequest) {
  // Logged-in operators have full access; unauthenticated requests receive read-only live telemetry
  await verifySessionFromRequest(req);

  try {
    const { searchParams } = new URL(req.url);

    const search = searchParams.get("search") || undefined;
    const classification = (searchParams.get("classification") as
      | LeadClassification
      | "ALL"
      | "UNCLASSIFIED") || undefined;
    const industry = searchParams.get("industry") || undefined;
    const status = (searchParams.get("status") as LeadStatus | "ALL") || undefined;
    const dateRange = (searchParams.get("dateRange") as
      | "all"
      | "today"
      | "7d"
      | "30d"
      | "90d") || undefined;

    const rawPage = parseInt(searchParams.get("page") || "1", 10);
    const page = isNaN(rawPage) || rawPage < 1 ? 1 : rawPage;

    const rawPageSize = parseInt(searchParams.get("pageSize") || "25", 10);
    const pageSize = isNaN(rawPageSize) || rawPageSize < 1 ? 25 : Math.min(100, rawPageSize);

    const sortBy = (searchParams.get("sortBy") as
      | "created_at"
      | "lead_score"
      | "company_name") || undefined;
    const sortOrder = (searchParams.get("sortOrder") as "asc" | "desc") || undefined;

    const data = await dashboardService.getDashboardData({
      search,
      classification,
      industry,
      status,
      dateRange,
      page,
      pageSize,
      sortBy,
      sortOrder,
    });

    return NextResponse.json(data, {
      status: 200,
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    });
  } catch (err) {
    // Avoid leaking internal error messages or stack traces
    console.error("[Dashboard API] Unhandled GET error:", err);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to retrieve dashboard metrics from database",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  // Defense-in-depth authorization check
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
        { success: false, error: "Valid payload is required" },
        { status: 400 }
      );
    }

    const { id, status } = body as Record<string, unknown>;

    if (!id || typeof id !== "string" || !UUID_REGEX.test(id)) {
      return NextResponse.json(
        { success: false, error: "Valid lead UUID identifier is required" },
        { status: 400 }
      );
    }

    const validStatuses: LeadStatus[] = [
      "NEW",
      "CONTACTED",
      "QUALIFIED",
      "MEETING_BOOKED",
      "WON",
      "LOST",
    ];

    if (typeof status !== "string" || !validStatuses.includes(status as LeadStatus)) {
      return NextResponse.json(
        { success: false, error: "Invalid status value provided" },
        { status: 400 }
      );
    }

    const result = await dashboardService.updateLeadStatus(id, status as LeadStatus);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || "Failed to update lead status" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, message: `Lead updated to ${status}` });
  } catch (err) {
    console.error("[Dashboard API] Unhandled PATCH error:", err);
    return NextResponse.json(
      { success: false, error: "Internal server error updating lead" },
      { status: 500 }
    );
  }
}
