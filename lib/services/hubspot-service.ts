import type { ValidatedLeadInput } from "../validations/lead";
import type { AIQualification } from "../validations/ai-qualification";
import type {
  HubSpotContactProperties,
  HubSpotUpsertResult,
} from "../../types/routing";
import { leadDbService } from "./lead-db-service";
import { maskSecrets } from "../utils/security";

export type HubSpotTransport = (
  endpoint: string,
  options: RequestInit
) => Promise<Response>;

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Maps FlowFoundry Lead & AI Qualification data into standard and custom HubSpot contact properties.
 */
export function mapLeadToHubSpotProperties(
  lead: ValidatedLeadInput,
  qualification: AIQualification
): HubSpotContactProperties {
  const nameParts = lead.fullName.trim().split(" ");
  const firstname = nameParts[0] || "";
  const lastname = nameParts.slice(1).join(" ") || "";

  return {
    email: lead.email.trim().toLowerCase(),
    firstname,
    lastname,
    phone: lead.phone?.trim() || undefined,
    company: lead.companyName.trim(),
    industry: lead.industry.trim(),
    website: lead.website?.trim() || undefined,
    flowfoundry_lead_score: qualification.lead_score.toString(),
    flowfoundry_classification: qualification.classification,
    flowfoundry_primary_problem: qualification.primary_problem.trim(),
    flowfoundry_automation_opportunity: qualification.automation_opportunity.trim(),
    lead_source: "website_audit_form",
    hs_lead_status: "NEW",
  };
}

/**
 * Service for HubSpot CRM Contact & Company synchronization.
 * Enforces email-based deduplication, updates existing records, handles API failures gracefully,
 * preserves database persistence in Supabase, masks secrets, and routes failures to an exception path.
 */
export const hubspotService = {
  mapProperties: mapLeadToHubSpotProperties,

  /**
   * Upserts a contact in HubSpot (creates new or updates existing based on email).
   * Supports an optional custom transport for testing and mock environments.
   */
  async upsertContact(
    lead: ValidatedLeadInput,
    qualification: AIQualification,
    options?: {
      leadId?: string;
      customTransport?: HubSpotTransport;
    }
  ): Promise<HubSpotUpsertResult> {
    const leadId = options?.leadId || "unassigned";
    const properties = mapLeadToHubSpotProperties(lead, qualification);
    const transport: HubSpotTransport =
      options?.customTransport ||
      ((endpoint, init) =>
        fetch(endpoint, {
          ...init,
          signal: AbortSignal.timeout(10000), // 10-second timeout guard
        }));

    const token = process.env.HUBSPOT_ACCESS_TOKEN;

    // Check credentials (when not using custom mock transport)
    if (!token && !options?.customTransport) {
      console.warn(
        `[FlowFoundry HubSpot] HUBSPOT_ACCESS_TOKEN not set. Lead ${leadId} preserved in database; routing to exception.`
      );
      return this.handleFailure(
        lead,
        leadId,
        "HubSpot credentials not configured in environment",
        properties,
        500
      );
    }

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token || "mock_token"}`,
    };

    const baseUrl = "https://api.hubapi.com/crm/v3/objects/contacts";

    try {
      // Step 1: Check if contact already exists by email to prevent duplicate records
      const lookupUrl = `${baseUrl}/${encodeURIComponent(properties.email)}?idProperty=email`;
      const lookupRes = await transport(lookupUrl, {
        method: "GET",
        headers,
      });

      if (lookupRes.ok) {
        // Contact already exists -> UPDATE existing contact record
        const contactData = (await lookupRes.json()) as { id: string };
        const contactId = contactData.id;

        const updateRes = await transport(`${baseUrl}/${contactId}`, {
          method: "PATCH",
          headers,
          body: JSON.stringify({ properties }),
        });

        if (!updateRes.ok) {
          const errText = await updateRes.text();
          return this.handleFailure(
            lead,
            leadId,
            `HubSpot update failed with status ${updateRes.status}: ${maskSecrets(errText)}`,
            properties,
            updateRes.status
          );
        }

        console.log(
          `[FlowFoundry HubSpot] Updated existing contact ${contactId} for ${properties.email} (Class: ${properties.flowfoundry_classification})`
        );

        return {
          success: true,
          contactId,
          action: "updated",
          properties,
        };
      } else if (lookupRes.status === 404) {
        // Contact does not exist -> CREATE new contact record
        const createRes = await transport(baseUrl, {
          method: "POST",
          headers,
          body: JSON.stringify({ properties }),
        });

        if (!createRes.ok) {
          const errText = await createRes.text();
          return this.handleFailure(
            lead,
            leadId,
            `HubSpot creation failed with status ${createRes.status}: ${maskSecrets(errText)}`,
            properties,
            createRes.status
          );
        }

        const newContact = (await createRes.json()) as { id: string };
        console.log(
          `[FlowFoundry HubSpot] Created new contact ${newContact.id} for ${properties.email} (Class: ${properties.flowfoundry_classification})`
        );

        return {
          success: true,
          contactId: newContact.id,
          action: "created",
          properties,
        };
      } else {
        // Lookup error (e.g., 401 Unauthorized, 429 Rate Limit, 500 Internal Error)
        const errText = await lookupRes.text();
        return this.handleFailure(
          lead,
          leadId,
          `HubSpot contact lookup failed with status ${lookupRes.status}: ${maskSecrets(errText)}`,
          properties,
          lookupRes.status
        );
      }
    } catch (error) {
      const isTimeout =
        error instanceof Error &&
        (error.name === "TimeoutError" || error.name === "AbortError");
      const message = isTimeout
        ? "HubSpot API request timed out (10s limit)"
        : error instanceof Error
        ? error.message
        : "Network error";

      return this.handleFailure(
        lead,
        leadId,
        `HubSpot API connection error: ${maskSecrets(message)}`,
        properties,
        isTimeout ? 504 : 500
      );
    }
  },

  /**
   * Resilient Exception Handler:
   * - Preserves the lead in the application database (Supabase).
   * - Sanitizes logs to prevent token/credential leaks.
   * - Routes to exception path for operator review.
   */
  async handleFailure(
    lead: ValidatedLeadInput,
    leadId: string,
    errorMessage: string,
    properties: HubSpotContactProperties,
    statusCode: number
  ): Promise<HubSpotUpsertResult> {
    const safeError = maskSecrets(errorMessage);
    const domain = lead.email.split("@")[1] || "unknown";
    console.error(
      `[FlowFoundry HubSpot Exception] Lead ${leadId} (${lead.companyName} / @${domain}) failed CRM sync: ${safeError}`
    );

    // Preserve lead in database: update status if valid UUID
    if (leadId && UUID_REGEX.test(leadId)) {
      try {
        await leadDbService.updateLead(leadId, {
          status: "NEW", // Preserved safely in database
        });
      } catch (dbErr) {
        console.error(
          `[FlowFoundry HubSpot] Could not update lead status in DB:`,
          maskSecrets(dbErr instanceof Error ? dbErr.message : "DB error")
        );
      }
    }

    // Return structured exception result so workflow diverts to exception path
    return {
      success: false,
      routedToException: true,
      error: safeError,
      statusCode,
      properties,
    };
  },
};
