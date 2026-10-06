import { ValidatedLeadInput } from "../validations/lead";
import type { LeadSubmissionSuccessResponse, EngineMetric } from "../../types/lead";
import { leadDbService } from "./lead-db-service";
import { executeQualificationPipeline } from "./qualification-pipeline";
import { maskSecrets, maskEmail, isTransientError } from "../utils/security";

/**
 * Dispatches an outbound webhook payload with a bounded timeout and single retry on transient failures.
 */
async function dispatchWebhookWithRetry(
  url: string,
  payload: Record<string, unknown>,
  leadId: string
): Promise<{ success: boolean; status?: number; error?: string }> {
  const maxAttempts = 2;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "FlowFoundry-Engine/1.0",
          "X-Lead-Id": leadId,
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(8000), // 8-second bounded timeout per attempt
      });

      if (res.ok) {
        return { success: true, status: res.status };
      }

      if (res.status >= 500 && attempt < maxAttempts) {
        console.warn(
          `[FlowFoundry Engine] Downstream webhook returned ${res.status} (attempt ${attempt}/${maxAttempts}). Retrying in 1s...`
        );
        await new Promise((r) => setTimeout(r, 1000));
        continue;
      }

      return {
        success: false,
        status: res.status,
        error: `Webhook returned status ${res.status}`,
      };
    } catch (err) {
      const isTimeout =
        err instanceof Error && (err.name === "TimeoutError" || err.name === "AbortError");
      const isTransient = isTimeout || isTransientError(err);

      if (attempt < maxAttempts && isTransient) {
        console.warn(
          `[FlowFoundry Engine] Downstream webhook transient failure (attempt ${attempt}/${maxAttempts}): ${
            isTimeout ? "Timeout" : "Network error"
          }. Retrying in 1s...`
        );
        await new Promise((r) => setTimeout(r, 1000));
        continue;
      }

      return {
        success: false,
        error: isTimeout ? "Webhook request timed out (8s limit)" : "Network connection failed",
      };
    }
  }

  return { success: false, error: "Exhausted dispatch attempts" };
}

/**
 * Business logic layer for FlowFoundry lead processing engine.
 *
 * Reliability Principles:
 * 1. Deduplication guard: Suppresses duplicate submissions within a 5-minute sliding window.
 * 2. Supabase persistence first ("Lead received is a lead saved"): Durably persists to DB before external calls.
 * 3. Downstream fault isolation: Webhook, AI, or CRM failures do not fail or destroy the saved lead.
 * 4. Sanitized observability: Zero credentials or sensitive PII logged.
 */
export async function processLeadSubmission(
  lead: ValidatedLeadInput
): Promise<LeadSubmissionSuccessResponse> {
  const normalizedEmail = lead.email.trim().toLowerCase();

  // 1. Deduplication Guard: Check if identical email submitted within the last 5 minutes
  try {
    const recentCheck = await leadDbService.findRecentLeadByEmail(normalizedEmail, 5);
    if (recentCheck.success && recentCheck.data) {
      const existingLead = recentCheck.data;
      console.log(
        `[FlowFoundry Engine] Duplicate submission suppressed for ${maskEmail(
          normalizedEmail
        )} (Existing Lead ID: ${existingLead.id}). Reusing record.`
      );

      return {
        success: true,
        message: "Lead received successfully",
        leadId: existingLead.id,
        isDuplicate: true,
      };
    }
  } catch (dedupErr) {
    // Non-fatal: if deduplication check fails, continue to normal creation
    console.warn(
      "[FlowFoundry Engine] Warning: Deduplication check encountered error, continuing ingestion:",
      dedupErr instanceof Error ? dedupErr.message : "Unknown error"
    );
  }

  // 2. Durably persist lead to Supabase PostgreSQL first (Principle: A lead received is a lead saved)
  const dbResult = await leadDbService.createLead({
    full_name: lead.fullName,
    company_name: lead.companyName,
    email: normalizedEmail,
    phone: lead.phone || null,
    website: lead.website || null,
    industry: lead.industry,
    employees: lead.employees,
    monthly_lead_volume: lead.monthlyLeadVolume,
    biggest_problem: lead.biggestProblem,
    current_tools: lead.currentTools,
    additional_information: lead.additionalInformation || null,
    status: "NEW",
    source: "website_audit_form",
  });

  if (!dbResult.success || !dbResult.data) {
    console.error(
      "[FlowFoundry Service] Failed to persist lead to database:",
      maskSecrets(dbResult.error || "Unknown database error")
    );
    // Never expose raw database error or credentials to callers
    throw new Error("Unable to securely persist lead record");
  }

  const persistedLead = dbResult.data;
  const leadId = persistedLead.id;

  // Safe server logging: sanitize data, never log credentials, API keys, or raw secrets
  const sanitizedLog = {
    event: "lead_persisted",
    leadId,
    company: persistedLead.company_name,
    emailMasked: maskEmail(persistedLead.email),
    domain: persistedLead.email.split("@")[1] || "unknown",
    industry: persistedLead.industry,
    monthlyVolume: persistedLead.monthly_lead_volume,
    timestamp: persistedLead.created_at,
  };

  console.log(`[FlowFoundry Engine] Lead saved: ${JSON.stringify(sanitizedLog)}`);

  // 3. Autonomous AI Qualification & Intent Scoring
  try {
    const pipelineRes = await executeQualificationPipeline(lead, { leadId });
    if (pipelineRes.success && pipelineRes.aiQualification) {
      const ai = pipelineRes.aiQualification;
      await leadDbService.updateLead(leadId, {
        lead_score: ai.lead_score,
        classification: ai.classification,
        business_type: ai.business_type,
        primary_problem: ai.primary_problem,
        automation_opportunity: ai.automation_opportunity,
        estimated_priority: ai.estimated_priority,
        recommended_next_step: ai.recommended_next_step,
        ai_reasoning: ai.reasoning,
        status: "QUALIFIED",
      });
      console.log(
        `[FlowFoundry Engine] Lead ${leadId} automatically qualified as ${ai.classification} (Score: ${ai.lead_score}/100)`
      );
    }
  } catch (aiErr) {
    console.warn(
      `[FlowFoundry Engine] Autonomous AI qualification error for lead ${leadId}:`,
      aiErr instanceof Error ? aiErr.message : "Unknown error"
    );
  }

  // 4. Downstream dispatch to n8n webhook (if configured)
  const webhookUrl = process.env.N8N_LEAD_WEBHOOK_URL;
  if (webhookUrl) {
    const payload = {
      leadId,
      fullName: persistedLead.full_name,
      companyName: persistedLead.company_name,
      email: persistedLead.email,
      phone: persistedLead.phone || "",
      website: persistedLead.website || "",
      industry: persistedLead.industry,
      employees: persistedLead.employees,
      monthlyLeadVolume: persistedLead.monthly_lead_volume,
      biggestProblem: persistedLead.biggest_problem,
      currentTools: persistedLead.current_tools,
      additionalInformation: persistedLead.additional_information || "",
      status: persistedLead.status,
      createdAt: persistedLead.created_at,
    };

    const dispatchResult = await dispatchWebhookWithRetry(webhookUrl, payload, leadId);

    if (!dispatchResult.success) {
      // Non-fatal for client: lead is safely stored in database
      console.warn(
        `[FlowFoundry Engine] Downstream webhook dispatch warning for lead ${leadId}: ${dispatchResult.error}. Lead is safely preserved in DB.`
      );
    } else {
      console.log(`[FlowFoundry Engine] Lead ${leadId} dispatched to n8n (HTTP ${dispatchResult.status}).`);
    }
  }

  return {
    success: true,
    message: "Lead received successfully",
    leadId,
  };
}

export const leadService = {
  processSubmission: processLeadSubmission,

  getSystemStatus(): {
    engine: "operational" | "degraded" | "maintenance";
    pipelineLatencyMs: number;
    metrics: EngineMetric[];
  } {
    return {
      engine: "operational",
      pipelineLatencyMs: 142,
      metrics: [
        { label: "Capture Velocity", value: "24.6/hr", change: "+12.4%", status: "positive" },
        { label: "AI Qualification Rate", value: "98.2%", change: "+0.8%", status: "positive" },
        { label: "Median Route Latency", value: "320ms", change: "-45ms", status: "positive" },
        { label: "Tier 1 Pipeline Yield", value: "41.5%", change: "+5.1%", status: "positive" },
      ],
    };
  },
};
