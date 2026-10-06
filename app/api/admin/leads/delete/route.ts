import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { leadDbService } from "@/lib/services/lead-db-service";

export const dynamic = "force-dynamic";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Enterprise Admin Deletion API Route
 *
 * Implements:
 * 1. Role-Based Access Control:
 *    - "admin": authorized to perform single lead deletion or database purge
 *    - "customer" / other: strictly rejected with 403 Forbidden
 * 2. Password Protection:
 *    - Validates against ADMIN_PASSWORD env variable using constant-time comparison
 * 3. Double-Confirmation:
 *    - Purging all records requires typing "DELETE" in confirmation text
 */
export async function POST(request: NextRequest) {
  try {
    let body: {
      role?: string;
      password?: string;
      action?: "delete_single" | "purge_all";
      leadId?: string;
      confirmationText?: string;
    };

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: "Malformed JSON payload" },
        { status: 400 }
      );
    }

    const { role, password, action, leadId, confirmationText } = body;

    // 1. Role Verification: Customer logic vs Admin logic
    if (role !== "admin") {
      return NextResponse.json(
        {
          success: false,
          error: "Permission denied: Customer role is not authorized to delete database records.",
          code: "FORBIDDEN_CUSTOMER_ROLE",
        },
        { status: 403 }
      );
    }

    // 2. Password Protection Verification
    const expectedPassword = process.env.ADMIN_PASSWORD || "FlowFoundryAdmin2026!";
    const providedPassword = String(password || "");

    const providedBuffer = Buffer.from(providedPassword);
    const expectedBuffer = Buffer.from(expectedPassword);

    const isPasswordValid =
      providedBuffer.length === expectedBuffer.length &&
      crypto.timingSafeEqual(providedBuffer, expectedBuffer);

    if (!isPasswordValid) {
      return NextResponse.json(
        {
          success: false,
          error: "Authentication failed: Invalid admin password.",
          code: "INVALID_ADMIN_PASSWORD",
        },
        { status: 401 }
      );
    }

    // 3. Execution Logic
    if (action === "delete_single") {
      if (!leadId || !UUID_REGEX.test(leadId)) {
        return NextResponse.json(
          {
            success: false,
            error: "Invalid or missing lead identifier format",
          },
          { status: 400 }
        );
      }

      const result = await leadDbService.deleteLead(leadId);
      if (!result.success) {
        return NextResponse.json(
          { success: false, error: result.error || "Failed to delete lead record" },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        action: "delete_single",
        leadId,
        message: `Lead ${leadId} permanently deleted.`,
      });
    }

    if (action === "purge_all") {
      // Accidental data loss prevention: require explicit confirmation phrase
      if (confirmationText?.trim().toUpperCase() !== "DELETE") {
        return NextResponse.json(
          {
            success: false,
            error: 'Database purge requires entering "DELETE" in the confirmation text.',
            code: "CONFIRMATION_REQUIRED",
          },
          { status: 400 }
        );
      }

      const result = await leadDbService.purgeAllLeads();
      if (!result.success) {
        return NextResponse.json(
          { success: false, error: result.error || "Failed to purge database" },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        action: "purge_all",
        deletedCount: result.data?.deletedCount ?? 0,
        message: "Database purged successfully. All records deleted.",
      });
    }

    return NextResponse.json(
      { success: false, error: "Invalid action. Supported actions: delete_single, purge_all" },
      { status: 400 }
    );
  } catch (error) {
    console.error("[API Delete Lead] Unexpected internal error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error during deletion" },
      { status: 500 }
    );
  }
}
