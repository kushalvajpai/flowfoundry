import { leadSubmissionSchema, type ValidatedLeadInput } from "../validations/lead";
import { routingService } from "./routing-service";
import type { RoutingResult } from "../../types/routing";
import { maskSecrets } from "../utils/security";

import type { AIQualification } from "../validations/ai-qualification";

export interface PipelineExecutionOptions {
  leadId?: string;
  aiEvaluator?: (lead: ValidatedLeadInput) => Promise<string | object>;
}

export interface PipelineExecutionResult {
  success: boolean;
  leadId: string;
  stageReached: "validation" | "ai_qualification" | "routing_completed";
  routingResult?: RoutingResult;
  aiQualification?: AIQualification;
  error?: string;
  validationErrors?: Record<string, string>;
}

/**
 * End-to-End FlowFoundry Qualification & Routing Pipeline:
 *
 * FLOW:
 * Webhook (Inbound Payload)
 *  → Validate (Zod Schema)
 *  → AI Qualification (Consultant Evaluation)
 *  → Parse JSON & Guard (Schema & Error Handling)
 *  → Routing (HOT / WARM / COLD / EXCEPTION)
 */
export async function executeQualificationPipeline(
  inboundPayload: unknown,
  options?: PipelineExecutionOptions
): Promise<PipelineExecutionResult> {
  const leadId =
    options?.leadId || `lead_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  // Step 1 & 2: Ingress & Validation
  const validation = leadSubmissionSchema.safeParse(inboundPayload);
  if (!validation.success) {
    const validationErrors: Record<string, string> = {};
    for (const issue of validation.error.issues) {
      validationErrors[issue.path.join(".") || "lead"] = issue.message;
    }

    console.warn(`[FlowFoundry Pipeline] Inbound validation failed for ${leadId}:`, validationErrors);

    return {
      success: false,
      leadId,
      stageReached: "validation",
      error: "Inbound lead failed validation schema",
      validationErrors,
    };
  }

  const validLead = validation.data;

  // Step 3: AI Qualification
  let rawAiOutput: unknown;
  try {
    if (options?.aiEvaluator) {
      rawAiOutput = await options.aiEvaluator(validLead);
    } else {
      // Default: If an OpenAI API key is present in environment, call OpenAI; otherwise return structured baseline
      const apiKey = process.env.OPENAI_API_KEY;
      if (apiKey) {
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: "gpt-4o",
            temperature: 0.2,
            messages: [
              {
                role: "system",
                content:
                  "You are a B2B automation consultant qualifying inbound business leads for FlowFoundry.\nReturn ONLY valid JSON matching this schema:\n{\n  \"lead_score\": 0,\n  \"classification\": \"HOT\",\n  \"business_type\": \"\",\n  \"primary_problem\": \"\",\n  \"automation_opportunity\": \"\",\n  \"estimated_priority\": \"HIGH\",\n  \"recommended_next_step\": \"\",\n  \"reasoning\": \"\"\n}",
              },
              {
                role: "user",
                content: `Evaluate this submitted lead:\n${JSON.stringify(validLead, null, 2)}`,
              },
            ],
          }),
          signal: AbortSignal.timeout(15000),
        });

        if (!response.ok) {
          throw new Error(`OpenAI API returned non-2xx status: ${response.status}`);
        }

        const data = await response.json();
        rawAiOutput = data.choices?.[0]?.message?.content || "";
      } else {
        // Fallback heuristic evaluation when running without live OpenAI credentials
        rawAiOutput = generateBaselineEvaluation(validLead);
      }
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "AI service unavailable";
    console.error(`[FlowFoundry Pipeline] AI qualification failed for ${leadId}:`, maskSecrets(errorMsg));

    // Malformed/failed AI stage: Route to exception path immediately, preserving original lead data
    const exceptionRouting = routingService.routeQualifiedLead(
      validLead,
      null, // Passing null forces exception quarantine
      { leadId }
    );

    return {
      success: true,
      leadId,
      stageReached: "routing_completed",
      routingResult: exceptionRouting,
    };
  }

  // Step 4 & 5: Parse JSON & Execute Routing (HOT, WARM, COLD, or EXCEPTION)
  const routingResult = routingService.routeQualifiedLead(validLead, rawAiOutput, { leadId });

  return {
    success: true,
    leadId,
    stageReached: "routing_completed",
    routingResult,
    aiQualification: routingResult.status === "routed" ? routingResult.aiQualification : undefined,
  };
}

/**
 * Deterministic baseline evaluator used when running locally or without external AI credentials.
 */
function generateBaselineEvaluation(lead: ValidatedLeadInput): object {
  const isHighVolume =
    lead.monthlyLeadVolume === "1000+" ||
    lead.monthlyLeadVolume === "201-1000" ||
    lead.monthlyLeadVolume.includes("501") ||
    lead.monthlyLeadVolume.includes("2,001") ||
    lead.monthlyLeadVolume.includes("10,000") ||
    lead.monthlyLeadVolume.includes("1,000");

  const isLargeOrg =
    lead.employees === "51-200" ||
    lead.employees === "201-500" ||
    lead.employees === "500+" ||
    lead.employees.includes("201") ||
    lead.employees.includes("1,000") ||
    lead.employees.includes("500");

  if (isHighVolume && isLargeOrg) {
    return {
      lead_score: 90,
      classification: "HOT",
      business_type: `${lead.industry} (${lead.employees} employees)`,
      primary_problem: lead.biggestProblem,
      automation_opportunity: "Automated inbound lead ingestion, validation, and bi-directional CRM deal synchronization",
      estimated_priority: "HIGH",
      recommended_next_step: "Conduct a 25-minute technical discovery session to review architectural requirements",
      reasoning: "High lead volume coupled with established organizational scale and clear qualification bottleneck represents strong automation ROI.",
    };
  } else if (isHighVolume || isLargeOrg) {
    return {
      lead_score: 65,
      classification: "WARM",
      business_type: `${lead.industry} (${lead.employees} employees)`,
      primary_problem: lead.biggestProblem,
      automation_opportunity: "Workflow automation and lead routing enhancement",
      estimated_priority: "MEDIUM",
      recommended_next_step: "Perform async architecture audit and follow up within 48 hours",
      reasoning: "Moderate scale and relevant operational challenge warrant consultative follow-up.",
    };
  } else {
    return {
      lead_score: 30,
      classification: "COLD",
      business_type: `${lead.industry} (${lead.employees} employees)`,
      primary_problem: lead.biggestProblem,
      automation_opportunity: "Standard self-service automation templates",
      estimated_priority: "LOW",
      recommended_next_step: "Share architectural guides and enroll in educational nurture sequence",
      reasoning: "Early-stage scale with low volume; best served by self-service resources at this stage.",
    };
  }
}
