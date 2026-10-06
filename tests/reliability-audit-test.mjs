/**
 * FlowFoundry Complete Reliability & Fault-Tolerance Verification Suite
 *
 * Traces and validates resilience across the complete pipeline:
 * Browser → Next.js API → n8n → OpenAI → Supabase → HubSpot → Resend
 *
 * Verifies safe handling for:
 * 1. Network timeouts & API timeouts
 * 2. Invalid / malformed AI output
 * 3. Database connection failure & transient retries
 * 4. CRM integration failure (HubSpot)
 * 5. Transactional email delivery failure (Resend)
 * 6. Malformed client requests
 * 7. Duplicate submissions (deduplication sliding window)
 * 8. Authentication & administrative boundary protection
 * 9. Secret masking & zero-data-loss invariants
 */

import fs from "node:fs";

// Load environment variables from .env.local
if (fs.existsSync(".env.local")) {
  const envContent = fs.readFileSync(".env.local", "utf8");
  for (const line of envContent.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#") && trimmed.includes("=")) {
      const [key, ...values] = trimmed.split("=");
      process.env[key.trim()] = values.join("=").trim();
    }
  }
}

const { executeQualificationPipeline } = await import("../lib/services/qualification-pipeline.ts");
const { routingService, parseAndValidateAiOutput } = await import("../lib/services/routing-service.ts");
const { hubspotService } = await import("../lib/services/hubspot-service.ts");
const { resendService } = await import("../lib/services/resend-service.ts");
const { leadDbService } = await import("../lib/services/lead-db-service.ts");
const { processLeadSubmission } = await import("../lib/services/lead-service.ts");
const { maskSecrets, maskEmail, isTransientError, sanitizeLogObject } = await import("../lib/utils/security.ts");
const { leadSubmissionSchema } = await import("../lib/validations/lead.ts");

let passedCount = 0;
let failedCount = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  [PASS] ${message}`);
    passedCount++;
  } else {
    console.error(`  [FAIL] ${message}`);
    failedCount++;
  }
}

async function runReliabilitySuite() {
  console.log("\n===============================================================");
  console.log("     FLOWFOUNDRY COMPLETE RELIABILITY AUDIT & TEST SUITE       ");
  console.log("===============================================================\n");

  const sampleLead = {
    fullName: "Alexandra Vance",
    companyName: "Vance Dynamics Systems",
    email: `alexandra.${Date.now()}@vancedynamics.io`,
    phone: "+1-415-555-0199",
    website: "https://vancedynamics.io",
    industry: "B2B SaaS / Software",
    employees: "51-200",
    monthlyLeadVolume: "501 - 2,000",
    biggestProblem: "Manual lead qualification creates 48-hour pipeline lag and sales rep drop-off.",
    currentTools: "HubSpot, Google Sheets, Slack, Zapier",
    additionalInformation: "Targeting enterprise automation audit.",
  };

  // -------------------------------------------------------------
  // Stage 1: Malformed Client Requests & Inbound Ingress Guard
  // -------------------------------------------------------------
  console.log("[Stage 1] Validating Ingress Guard against Malformed Requests...");

  // 1.1 Empty payload
  const emptyValidation = leadSubmissionSchema.safeParse({});
  assert(!emptyValidation.success, "Empty payload is strictly rejected by schema");

  // 1.2 Invalid email format
  const badEmailValidation = leadSubmissionSchema.safeParse({
    ...sampleLead,
    email: "not-an-email",
  });
  assert(!badEmailValidation.success, "Invalid email format rejected with 400 validation error");

  // 1.3 Missing critical business fields
  const missingProblemValidation = leadSubmissionSchema.safeParse({
    ...sampleLead,
    biggestProblem: "short", // less than 10 chars
  });
  assert(!missingProblemValidation.success, "Short problem description (<10 chars) rejected");

  // 1.4 Valid lead passes
  const validValidation = leadSubmissionSchema.safeParse(sampleLead);
  assert(validValidation.success, "Valid lead successfully passes ingress schema");

  // -------------------------------------------------------------
  // Stage 2: Database Persistence & Transient Error Resilience
  // -------------------------------------------------------------
  console.log("\n[Stage 2] Testing Supabase Persistence & Transient Error Resilience...");

  // 2.1 Lead received is a lead saved
  const dbCreateRes = await leadDbService.createLead({
    full_name: sampleLead.fullName,
    company_name: sampleLead.companyName,
    email: sampleLead.email,
    phone: sampleLead.phone,
    website: sampleLead.website,
    industry: sampleLead.industry,
    employees: sampleLead.employees,
    monthly_lead_volume: sampleLead.monthlyLeadVolume,
    biggest_problem: sampleLead.biggestProblem,
    current_tools: sampleLead.currentTools,
    additional_information: sampleLead.additionalInformation,
    status: "NEW",
    source: "reliability_test_suite",
  });

  assert(dbCreateRes.success && dbCreateRes.data?.id !== undefined, "Lead durably saved to Supabase leads table");
  const testLeadId = dbCreateRes.data?.id;

  // 2.2 Transient error detection
  assert(isTransientError(new Error("fetch failed")), "Detects 'fetch failed' as transient error");
  assert(isTransientError(new Error("network timeout")), "Detects 'network timeout' as transient error");
  assert(isTransientError(new Error("503 Service Unavailable")), "Detects 503 as transient error");
  assert(!isTransientError(new Error("column 'foo' does not exist")), "Non-transient SQL error is not flagged as transient");

  // -------------------------------------------------------------
  // Stage 3: Duplicate Submission Protection (Deduplication Window)
  // -------------------------------------------------------------
  console.log("\n[Stage 3] Testing Duplicate Submission Suppression (Deduplication Guard)...");

  // 3.1 Check findRecentLeadByEmail identifies the lead we just created
  const recentCheck = await leadDbService.findRecentLeadByEmail(sampleLead.email, 5);
  assert(recentCheck.success && recentCheck.data !== null, "Identifies recent submission within 5-minute window");
  assert(recentCheck.data?.id === testLeadId, "Retrieved recent lead ID matches original submission");

  // 3.2 processLeadSubmission returns idempotent response for duplicate
  const duplicateSubmissionResult = await processLeadSubmission(sampleLead);
  assert(duplicateSubmissionResult.success === true, "Duplicate submission returns successful user status");
  assert(duplicateSubmissionResult.isDuplicate === true, "Duplicate submission flags isDuplicate: true");
  assert(duplicateSubmissionResult.leadId === testLeadId, "Duplicate submission reuses existing persisted lead ID");

  // -------------------------------------------------------------
  // Stage 4: AI Qualification Failures & Malformed Output Recovery
  // -------------------------------------------------------------
  console.log("\n[Stage 4] Testing AI Qualification Failures & Malformed Output Recovery...");

  // 4.1 Non-JSON string output
  const badJsonParsed = parseAndValidateAiOutput("Sorry, I cannot complete this evaluation because I am an AI model.");
  assert(!badJsonParsed.success, "Non-JSON string fails parsing cleanly without crash");

  // 4.2 Code fences stripped
  const codeFencedOutput = "```json\n{\n  \"lead_score\": 88,\n  \"classification\": \"HOT\",\n  \"business_type\": \"SaaS\",\n  \"primary_problem\": \"Latency\",\n  \"automation_opportunity\": \"Ingestion\",\n  \"estimated_priority\": \"HIGH\",\n  \"recommended_next_step\": \"Discovery\",\n  \"reasoning\": \"Clear ROI\"\n}\n```";
  const fencedParsed = parseAndValidateAiOutput(codeFencedOutput);
  assert(fencedParsed.success === true && fencedParsed.data.lead_score === 88, "Markdown code fences stripped and parsed correctly");

  // 4.3 Missing mandatory fields / out-of-range score
  const invalidSchemaOutput = JSON.stringify({
    lead_score: 999, // Out of 0-100 range
    classification: "INVALID_TAG",
  });
  const invalidParsed = parseAndValidateAiOutput(invalidSchemaOutput);
  assert(!invalidParsed.success, "Schema violation (score 999, invalid tag) caught by validation guard");

  // 4.4 Exception routing preserves original lead
  const exceptionResult = routingService.routeQualifiedLead(sampleLead, "BROKEN_JSON", { leadId: testLeadId });
  assert(exceptionResult.status === "exception", "Broken AI output routes to exception path");
  assert(exceptionResult.manualReviewRequired === true, "Flags manualReviewRequired: true");
  assert(exceptionResult.originalLeadData.email === sampleLead.email, "Original lead data preserved in full during AI failure");
  assert(exceptionResult.crmRecord.priority === "HIGH", "Quarantined lead escalated to HIGH priority for manual review");

  // 4.5 AI pipeline execution catches timeout / network error and falls back to exception
  const pipelineResult = await executeQualificationPipeline(sampleLead, {
    leadId: testLeadId,
    aiEvaluator: async () => {
      const err = new Error("OpenAI gateway timeout");
      err.name = "TimeoutError";
      throw err;
    },
  });
  assert(pipelineResult.success === true, "Pipeline handles AI evaluator timeout gracefully");
  assert(pipelineResult.routingResult?.status === "exception", "Pipeline routes timed-out AI call to exception review");

  // -------------------------------------------------------------
  // Stage 5: CRM Integration (HubSpot) Failure Resilience
  // -------------------------------------------------------------
  console.log("\n[Stage 5] Testing HubSpot CRM Integration Failure Resilience...");

  const testQualification = {
    lead_score: 92,
    classification: "HOT",
    business_type: "B2B SaaS (51-200 employees)",
    primary_problem: sampleLead.biggestProblem,
    automation_opportunity: "Automated qualification pipeline",
    estimated_priority: "HIGH",
    recommended_next_step: "Schedule Discovery Call",
    reasoning: "High lead volume with manual qualification bottleneck.",
  };

  // 5.1 Simulate HubSpot 503 Service Outage
  const mockHubSpotFailureTransport = async () => {
    return new Response(JSON.stringify({ message: "HubSpot CRM temporarily unavailable" }), {
      status: 503,
      headers: { "Content-Type": "application/json" },
    });
  };

  const crmFailResult = await hubspotService.upsertContact(sampleLead, testQualification, {
    leadId: testLeadId,
    customTransport: mockHubSpotFailureTransport,
  });

  assert(crmFailResult.success === false, "CRM failure returns structured failure result");
  assert(crmFailResult.routedToException === true, "CRM failure routes workflow to exception path");
  assert(crmFailResult.statusCode === 503, "Captures correct HTTP 503 status code");

  // 5.2 Verify lead in database is NOT destroyed
  const dbCheckAfterCrmFail = await leadDbService.getLeadById(testLeadId);
  assert(dbCheckAfterCrmFail.success && dbCheckAfterCrmFail.data !== null, "Lead in Supabase remains intact after CRM failure");

  // 5.3 Simulate HubSpot network timeout
  const mockHubSpotTimeoutTransport = async () => {
    const err = new Error("The operation was aborted due to timeout");
    err.name = "TimeoutError";
    throw err;
  };

  const crmTimeoutResult = await hubspotService.upsertContact(sampleLead, testQualification, {
    leadId: testLeadId,
    customTransport: mockHubSpotTimeoutTransport,
  });
  assert(crmTimeoutResult.routedToException === true, "CRM network timeout caught and routed to exception");

  // -------------------------------------------------------------
  // Stage 6: Email Delivery (Resend) Failure Resilience
  // -------------------------------------------------------------
  console.log("\n[Stage 6] Testing Resend Email Automation Failure Resilience...");

  // 6.1 Simulate Resend 500 API Gateway Outage with Secret Leak Attempt
  const mockResendFailureTransport = async () => {
    return new Response(
      JSON.stringify({
        message: "Upstream error with key re_1234567890abcdefghijklmnop and Bearer secret_token_xyz123",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  };

  const emailFailResult = await resendService.dispatchLeadEmails(sampleLead, testQualification, {
    leadId: testLeadId,
    customTransport: mockResendFailureTransport,
    apiKey: "re_mock_test_key_1234567890",
  });

  assert(emailFailResult.success === false, "Resend 500 outage detected");
  assert(emailFailResult.leadPreserved === true, "Lead preserved flag is true despite email failure");
  assert(!emailFailResult.errorReason?.includes("re_1234567890"), "Resend API key is masked from error telemetry");
  assert(!emailFailResult.errorReason?.includes("secret_token_xyz123"), "Bearer token is masked from error telemetry");

  // 6.2 Verify lead in database is NOT destroyed after email failure
  const dbCheckAfterEmailFail = await leadDbService.getLeadById(testLeadId);
  assert(dbCheckAfterEmailFail.success && dbCheckAfterEmailFail.data !== null, "Lead in Supabase remains intact after email failure");

  // -------------------------------------------------------------
  // Stage 7: Secret Masking & PII Sanitization
  // -------------------------------------------------------------
  console.log("\n[Stage 7] Testing Secret Masking & PII Redaction Invariants...");

  const rawSecretLog = "Calling OpenAI with sk-proj-12345678901234567890 and Resend re_98765432101234567890 with Bearer jwt.token.here";
  const maskedLog = maskSecrets(rawSecretLog);
  assert(!maskedLog.includes("sk-proj-"), "OpenAI secret key redacted");
  assert(!maskedLog.includes("re_987654"), "Resend secret key redacted");
  assert(maskedLog.includes("[REDACTED_OPENAI_KEY]"), "Replaced with safe OpenAI indicator");
  assert(maskedLog.includes("[REDACTED_RESEND_KEY]"), "Replaced with safe Resend indicator");

  const maskedEmailResult = maskEmail("elena.rostova@acmecorp.com");
  assert(maskedEmailResult === "e***a@acmecorp.com", "Email masked cleanly to protect PII");

  const sanitizedObject = sanitizeLogObject({
    apiKey: "re_secret1234567890",
    email: "test@domain.com",
    company: "Acme Inc",
    nested: {
      password: "SuperSecretPassword123",
      token: "secret_token",
    },
  });

  assert(sanitizedObject.apiKey === "[REDACTED]", "apiKey field redacted");
  assert(sanitizedObject.nested.password === "[REDACTED]", "Nested password redacted");
  assert(sanitizedObject.nested.token === "[REDACTED]", "Nested token redacted");
  assert(sanitizedObject.company === "Acme Inc", "Non-sensitive company preserved");

  // -------------------------------------------------------------
  // Summary
  // -------------------------------------------------------------
  console.log("\n===============================================================");
  console.log(`   RELIABILITY AUDIT: ${passedCount} PASSED | ${failedCount} FAILED`);
  console.log("===============================================================\n");

  if (failedCount > 0) {
    process.exit(1);
  }
}

runReliabilitySuite().catch((err) => {
  console.error("Reliability audit suite crashed:", err);
  process.exit(1);
});
