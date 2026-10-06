import { NextRequest, NextResponse } from "next/server";
import { leadSubmissionSchema } from "@/lib/validations/lead";
import { processLeadSubmission } from "@/lib/services/lead-service";
import { maskSecrets } from "@/lib/utils/security";

export async function POST(request: NextRequest) {
  // 1. Reject malformed JSON
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      {
        success: false,
        message: "Unable to process your request",
        error: "Malformed JSON payload",
      },
      { status: 400 }
    );
  }

  // 2. Reject empty body or non-object payloads
  if (!body || typeof body !== "object" || Object.keys(body).length === 0) {
    return NextResponse.json(
      {
        success: false,
        message: "Unable to process your request",
        error: "Request body cannot be empty",
      },
      { status: 400 }
    );
  }

  // 3. Validate schema rules (required fields, email, URL format, length limits)
  const validation = leadSubmissionSchema.safeParse(body);
  if (!validation.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of validation.error.issues) {
      const field = issue.path[0]?.toString() || "form";
      if (!fieldErrors[field]) {
        fieldErrors[field] = issue.message;
      }
    }

    return NextResponse.json(
      {
        success: false,
        message: "Unable to process your request",
        errors: fieldErrors,
      },
      { status: 400 }
    );
  }

  // 4. Delegate to business logic layer
  try {
    const result = await processLeadSubmission(validation.data);
    return NextResponse.json(
      {
        success: true,
        message: result.message,
        leadId: result.leadId,
      },
      { status: 200 }
    );
  } catch (error) {
    // 5. Safe server-side error logging (never expose secrets or stack traces to client)
    const errMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("[FlowFoundry API] Error processing lead submission:", maskSecrets(errMessage));

    return NextResponse.json(
      {
        success: false,
        message: "Unable to process your request",
      },
      { status: 500 }
    );
  }
}
