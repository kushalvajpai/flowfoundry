import { aiQualificationSchema, type AIQualification } from "../validations/ai-qualification";
import type { ValidatedLeadInput } from "../validations/lead";
import type {
  RoutingResult,
  RoutingSuccessResult,
  RoutingExceptionResult,
  CrmRecord,
  InternalSalesNotification,
  ProspectConfirmationEmail,
} from "../../types/routing";

/**
 * Safely parses and validates the raw output from an AI qualification model.
 * Handles stringified JSON or raw JavaScript objects without crashing.
 */
export function parseAndValidateAiOutput(
  rawAiOutput: unknown
): { success: true; data: AIQualification } | { success: false; error: string } {
  if (rawAiOutput === null || rawAiOutput === undefined) {
    return { success: false, error: "AI output is null or undefined" };
  }

  let parsed: unknown;

  if (typeof rawAiOutput === "string") {
    const trimmed = rawAiOutput.trim();
    if (!trimmed) {
      return { success: false, error: "AI output string is empty" };
    }

    // Strip markdown code fences if LLM wrapped JSON in ```json ... ```
    const cleaned = trimmed.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");

    try {
      parsed = JSON.parse(cleaned);
    } catch {
      return { success: false, error: "Failed to parse AI output as valid JSON" };
    }
  } else if (typeof rawAiOutput === "object") {
    parsed = rawAiOutput;
  } else {
    return { success: false, error: `Unexpected AI output type: ${typeof rawAiOutput}` };
  }

  const validation = aiQualificationSchema.safeParse(parsed);
  if (!validation.success) {
    const errorDetails = validation.error.issues
      .map((issue) => `${issue.path.join(".") || "root"}: ${issue.message}`)
      .join("; ");
    return { success: false, error: `AI qualification schema violation: ${errorDetails}` };
  }

  return { success: true, data: validation.data };
}

/**
 * Handles routing when AI output is malformed or invalid.
 * Prevents blind progression, logs safely without leaking PII, and preserves the complete original lead data.
 */
function handleRoutingException(
  lead: ValidatedLeadInput,
  rawAiOutput: unknown,
  errorReason: string,
  leadId: string
): RoutingExceptionResult {
  const timestamp = new Date().toISOString();

  // Safe server logging: sanitize data, never log full email, phone, or secrets
  const sanitizedLog = {
    event: "routing_exception",
    leadId,
    company: lead.companyName,
    domain: lead.email.split("@")[1] || "unknown",
    errorReason,
    timestamp,
  };

  console.warn(`[FlowFoundry Router] EXCEPTION: ${JSON.stringify(sanitizedLog)}`);

  return {
    status: "exception",
    leadId,
    errorReason,
    manualReviewRequired: true,
    originalLeadData: { ...lead }, // Complete, pristine lead data preserved
    rawAiOutput,
    crmRecord: {
      leadId,
      priority: "HIGH", // Elevated to HIGH priority for human operator triage
      workflow: "exception_review",
      status: "review_required",
      timestamp,
    },
    internalAlert: {
      targetChannel: "engineering_and_operations",
      leadId,
      message: `Qualification failed for lead from ${lead.companyName}. Reason: ${errorReason}. Routed to manual review quarantine.`,
      timestamp,
    },
    timestamp,
  };
}

/**
 * Core Lead Routing Stage:
 * Evaluates validated AI qualification output and directs the lead into appropriate CRM,
 * notification, and outreach workflows based on classification (HOT, WARM, COLD).
 */
export function routeQualifiedLead(
  lead: ValidatedLeadInput,
  rawAiOutput: unknown,
  options?: { leadId?: string }
): RoutingResult {
  const leadId =
    options?.leadId || `lead_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const timestamp = new Date().toISOString();

  // Step 1: Parse and validate AI qualification output
  const parsedAi = parseAndValidateAiOutput(rawAiOutput);

  if (!parsedAi.success) {
    return handleRoutingException(lead, rawAiOutput, parsedAi.error, leadId);
  }

  const ai = parsedAi.data;

  // Step 2: Prepare base CRM record (persisting AI classification, score, and reasoning)
  const baseCrmRecord: CrmRecord = {
    leadId,
    contact: {
      fullName: lead.fullName,
      companyName: lead.companyName,
      email: lead.email,
      phone: lead.phone || undefined,
      website: lead.website || undefined,
      industry: lead.industry,
      employees: lead.employees,
      monthlyLeadVolume: lead.monthlyLeadVolume,
      currentTools: lead.currentTools,
      biggestProblem: lead.biggestProblem,
      additionalInformation: lead.additionalInformation || undefined,
    },
    qualification: {
      score: ai.lead_score,
      classification: ai.classification,
      businessType: ai.business_type,
      primaryProblem: ai.primary_problem,
      automationOpportunity: ai.automation_opportunity,
      reasoning: ai.reasoning,
    },
    routing: {
      priority: ai.classification === "HOT" ? "HIGH" : ai.classification === "WARM" ? "MEDIUM" : "LOW",
      stage: "",
      workflow: "discovery_call",
      recommendedNextStep: ai.recommended_next_step,
      timestamp,
    },
  };

  // Safe server logging for routing execution
  console.log(
    `[FlowFoundry Router] Lead ${leadId} (${lead.companyName}) classified as ${ai.classification} (Score: ${ai.lead_score}/100)`
  );

  // Step 3: Branch routing according to classification
  switch (ai.classification) {
    case "HOT": {
      baseCrmRecord.routing.stage = "High Priority — Discovery Recommended";
      baseCrmRecord.routing.workflow = "discovery_call";

      // Immediate internal sales alert
      const internalNotification: InternalSalesNotification = {
        targetChannel: "sales_alerts_high_priority",
        urgency: "IMMEDIATE",
        leadId,
        companyName: lead.companyName,
        contactName: lead.fullName,
        email: lead.email,
        leadScore: ai.lead_score,
        classification: "HOT",
        primaryProblem: ai.primary_problem,
        automationOpportunity: ai.automation_opportunity,
        reasoning: ai.reasoning,
        recommendedAction: `Schedule Discovery Call. ${ai.recommended_next_step}`,
        timestamp,
      };

      // Consultative, professional, non-aggressive prospect confirmation
      const prospectEmail: ProspectConfirmationEmail = {
        recipientEmail: lead.email,
        recipientName: lead.fullName,
        subject: `Your Automation Architecture Assessment — FlowFoundry`,
        templateType: "hot_discovery_invitation",
        copy: {
          greeting: `Hello ${lead.fullName.split(" ")[0]},`,
          acknowledgment: `Thank you for requesting an Automation Architecture Assessment for ${lead.companyName}. We have reviewed your intake details regarding ${ai.primary_problem}.`,
          nextSteps: `Based on your monthly volume (${lead.monthlyLeadVolume}) and current stack (${lead.currentTools}), your workflows show strong potential for ${ai.automation_opportunity}. We would be glad to walk you through our technical recommendations.`,
          callToAction: {
            label: "Schedule Technical Discovery Session",
            url: `https://flowfoundry.io/schedule?lead=${leadId}`,
          },
          signoff: "Best regards,\nThe FlowFoundry Solutions Architecture Team",
        },
      };

      const result: RoutingSuccessResult = {
        status: "routed",
        leadId,
        classification: "HOT",
        priority: "HIGH",
        aiQualification: ai,
        crmRecord: baseCrmRecord,
        internalNotification,
        prospectEmail,
        nextWorkflow: "discovery_call",
        timestamp,
      };

      return result;
    }

    case "WARM": {
      baseCrmRecord.routing.stage = "Qualified — Standard Follow-Up";
      baseCrmRecord.routing.workflow = "follow_up";

      // Thoughtful, non-aggressive follow-up confirmation
      const prospectEmail: ProspectConfirmationEmail = {
        recipientEmail: lead.email,
        recipientName: lead.fullName,
        subject: `Inbound Intake Received — FlowFoundry`,
        templateType: "warm_intake_acknowledgment",
        copy: {
          greeting: `Hello ${lead.fullName.split(" ")[0]},`,
          acknowledgment: `Thank you for sharing your operational requirements for ${lead.companyName}. We have logged your details regarding ${ai.primary_problem}.`,
          nextSteps: `Our engineering team evaluates submissions in detail to ensure we provide targeted architecture recommendations. A solutions consultant will review your stack and follow up with you within 24 to 48 business hours.`,
          signoff: "Warm regards,\nThe FlowFoundry Team",
        },
      };

      const result: RoutingSuccessResult = {
        status: "routed",
        leadId,
        classification: "WARM",
        priority: "MEDIUM",
        aiQualification: ai,
        crmRecord: baseCrmRecord,
        prospectEmail,
        nextWorkflow: "follow_up",
        timestamp,
      };

      return result;
    }

    case "COLD": {
      baseCrmRecord.routing.stage = "Low Touch — Nurture Sequence";
      baseCrmRecord.routing.workflow = "nurture";

      // Respectful, low-pressure receipt confirmation with self-service resources
      const prospectEmail: ProspectConfirmationEmail = {
        recipientEmail: lead.email,
        recipientName: lead.fullName,
        subject: `Thank you for connecting with FlowFoundry`,
        templateType: "cold_resource_acknowledgment",
        copy: {
          greeting: `Hello ${lead.fullName.split(" ")[0]},`,
          acknowledgment: `Thank you for your interest in FlowFoundry. We have received your inquiry for ${lead.companyName}.`,
          nextSteps: `While our enterprise automation engagements typically focus on high-velocity inbound pipelines, we publish comprehensive architectural blueprints and automation guides that may assist your team.`,
          callToAction: {
            label: "Explore Automation Architecture Guides",
            url: "https://flowfoundry.io/resources",
          },
          signoff: "Sincerely,\nFlowFoundry Resources",
        },
      };

      const result: RoutingSuccessResult = {
        status: "routed",
        leadId,
        classification: "COLD",
        priority: "LOW",
        aiQualification: ai,
        crmRecord: baseCrmRecord,
        prospectEmail,
        nextWorkflow: "nurture",
        timestamp,
      };

      return result;
    }
  }
}

export const routingService = {
  parseAndValidateAiOutput,
  routeQualifiedLead,
};
