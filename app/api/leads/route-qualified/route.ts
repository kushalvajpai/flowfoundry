import { NextRequest, NextResponse } from "next/server";
import { leadSubmissionSchema } from "@/lib/validations/lead";
import { routeQualifiedLead } from "@/lib/services/routing-service";
import { verifySessionFromRequest } from "@/lib/auth/session";

/**
 * POST /api/leads/route-qualified
 *
 * Ingests a validated lead and its AI qualification output,
 * validates the AI schema, and executes the routing stage:
 * - HOT: Priority HIGH, CRM record, immediate internal alert, discovery call recommendation
 * - WARM: Priority MEDIUM, CRM record, follow-up workflow, consultative confirmation
 * - COLD: Priority LOW, CRM record, nurture workflow, educational confirmation
 * - Malformed / Invalid: Routes to exception path, preserves original lead data, alerts operations
 */
export async function POST(request: NextRequest) {
  // Defense-in-depth authorization check
  const session = await verifySessionFromRequest(request);
  const internalHeaderKey = request.headers.get("x-flowfoundry-internal-key");
  const configuredSecret = process.env.DASHBOARD_SECRET_KEY;
  const isInternalKeyValid =
    Boolean(configuredSecret && internalHeaderKey && internalHeaderKey === configuredSecret);

  if (!session && !isInternalKeyValid) {
    return NextResponse.json(
      {
        success: false,
        error: "Unauthorized: Valid operator session or internal service key required",
      },
      {
        status: 401,
        headers: { "WWW-Authenticate": 'Bearer realm="FlowFoundry Internal"' },
      }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: "Malformed JSON payload in request body",
      },
      { status: 400 }
    );
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json(
      {
        success: false,
        error: "Request body must be a JSON object containing 'lead' and 'aiQualification'",
      },
      { status: 400 }
    );
  }

  const payload = body as Record<string, unknown>;

  if (!payload.lead || typeof payload.lead !== "object") {
    return NextResponse.json(
      {
        success: false,
        error: "Missing required 'lead' object in request body",
      },
      { status: 400 }
    );
  }

  if (payload.aiQualification === undefined) {
    return NextResponse.json(
      {
        success: false,
        error: "Missing required 'aiQualification' field in request body",
      },
      { status: 400 }
    );
  }

  // Validate lead fields with Zod
  const leadValidation = leadSubmissionSchema.safeParse(payload.lead);
  if (!leadValidation.success) {
    const errors: Record<string, string> = {};
    for (const issue of leadValidation.error.issues) {
      errors[issue.path.join(".") || "lead"] = issue.message;
    }
    return NextResponse.json(
      {
        success: false,
        error: "Lead validation failed",
        details: errors,
      },
      { status: 400 }
    );
  }

  try {
    const routingResult = routeQualifiedLead(
      leadValidation.data,
      payload.aiQualification
    );

    return NextResponse.json(
      {
        success: true,
        data: routingResult,
      },
      { status: 200 }
    );
  } catch (error) {
    const errMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("[FlowFoundry API] Unhandled error during lead routing:", errMessage);

    return NextResponse.json(
      {
        success: false,
        error: "Internal error processing lead routing",
      },
      { status: 500 }
    );
  }
}
