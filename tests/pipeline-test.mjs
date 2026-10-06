import assert from "node:assert/strict";
import { executeQualificationPipeline } from "../lib/services/qualification-pipeline.ts";

async function runPipelineTests() {
  console.log("=== FlowFoundry End-to-End Qualification Pipeline Test Suite ===\n");

  const validLeadInput = {
    fullName: "Elena Vance",
    companyName: "Vance Dynamics",
    email: "elena@vancedynamics.com",
    phone: "+1-555-0199",
    website: "https://vancedynamics.com",
    industry: "B2B SaaS / Software",
    employees: "51-200",
    monthlyLeadVolume: "501 - 2,000",
    biggestProblem: "Manual lead qualification takes 45 minutes per lead, causing 60% pipeline drop-off.",
    currentTools: "HubSpot, Zapier, Google Sheets",
    additionalInformation: "Looking for SOC-2 compliance.",
  };

  // Test 1: Inbound Lead Validation Failure
  console.log("Test 1: Inbound Validation Rejection");
  const invalidInbound = { fullName: "A" }; // Missing required fields
  const res1 = await executeQualificationPipeline(invalidInbound);
  assert.equal(res1.success, false);
  assert.equal(res1.stageReached, "validation");
  assert.ok(res1.validationErrors, "Must report validation errors");
  console.log("✓ PASS: Inbound validation correctly rejected malformed lead.\n");

  // Test 2: Full Pipeline - HOT Lead Execution
  console.log("Test 2: Full Pipeline - HOT Lead Execution");
  const res2 = await executeQualificationPipeline(validLeadInput, {
    aiEvaluator: async () => ({
      lead_score: 95,
      classification: "HOT",
      business_type: "Mid-market B2B SaaS",
      primary_problem: "High-latency manual lead qualification causing lead decay",
      automation_opportunity: "Autonomous AI-driven ingestion and HubSpot CRM deal routing",
      estimated_priority: "HIGH",
      recommended_next_step: "Schedule 25-minute technical discovery session",
      reasoning: "High lead volume coupled with severe qualification latency represents immediate high-ROI automation opportunity.",
    }),
  });

  assert.equal(res2.success, true);
  assert.equal(res2.stageReached, "routing_completed");
  assert.equal(res2.routingResult?.status, "routed");
  assert.equal(res2.routingResult?.classification, "HOT");
  assert.equal(res2.routingResult?.priority, "HIGH");
  assert.ok(res2.routingResult?.internalNotification, "Must dispatch sales alert");
  assert.equal(res2.routingResult?.internalNotification.urgency, "IMMEDIATE");
  assert.ok(res2.routingResult?.prospectEmail?.copy.callToAction?.label.includes("Discovery"));
  console.log("✓ PASS: HOT lead processed through Webhook -> Validate -> AI -> Parse JSON -> Routing.\n");

  // Test 3: Full Pipeline - WARM Lead Execution
  console.log("Test 3: Full Pipeline - WARM Lead Execution");
  const res3 = await executeQualificationPipeline(validLeadInput, {
    aiEvaluator: async () => ({
      lead_score: 65,
      classification: "WARM",
      business_type: "Mid-market B2B Agency",
      primary_problem: "Data sync discrepancies between spreadsheets and CRM",
      automation_opportunity: "Scheduled normalization and sync pipeline",
      estimated_priority: "MEDIUM",
      recommended_next_step: "Conduct asynchronous review and schedule follow-up",
      reasoning: "Relevant business pain with moderate volume.",
    }),
  });

  assert.equal(res3.success, true);
  assert.equal(res3.routingResult?.classification, "WARM");
  assert.equal(res3.routingResult?.priority, "MEDIUM");
  assert.equal(res3.routingResult?.nextWorkflow, "follow_up");
  assert.equal(res3.routingResult?.internalNotification, undefined, "No high-priority alert for WARM");
  console.log("✓ PASS: WARM lead enrolled in follow-up workflow with MEDIUM priority.\n");

  // Test 4: Full Pipeline - COLD Lead Execution
  console.log("Test 4: Full Pipeline - COLD Lead Execution");
  const res4 = await executeQualificationPipeline(validLeadInput, {
    aiEvaluator: async () => ({
      lead_score: 20,
      classification: "COLD",
      business_type: "Early-stage single operator",
      primary_problem: "General inquiry on automation tools",
      automation_opportunity: "Self-service architectural guides",
      estimated_priority: "LOW",
      recommended_next_step: "Enroll in educational nurture list",
      reasoning: "Scale does not meet enterprise custom architecture threshold.",
    }),
  });

  assert.equal(res4.success, true);
  assert.equal(res4.routingResult?.classification, "COLD");
  assert.equal(res4.routingResult?.priority, "LOW");
  assert.equal(res4.routingResult?.nextWorkflow, "nurture");
  assert.ok(res4.routingResult?.prospectEmail?.copy.callToAction?.url.includes("/resources"));
  console.log("✓ PASS: COLD lead enrolled in nurture workflow with educational resources.\n");

  // Test 5: Full Pipeline - Malformed AI Output (Preserves Original Lead)
  console.log("Test 5: Full Pipeline - Malformed AI Output Handling");
  const res5 = await executeQualificationPipeline(validLeadInput, {
    aiEvaluator: async () => "CORRUPT RAW OUTPUT NOT JSON",
  });

  assert.equal(res5.success, true);
  assert.equal(res5.routingResult?.status, "exception");
  assert.equal(res5.routingResult?.manualReviewRequired, true);
  // Verify complete original lead data is preserved
  assert.deepEqual(res5.routingResult?.originalLeadData, validLeadInput);
  assert.equal(res5.routingResult?.crmRecord.status, "review_required");
  console.log("✓ PASS: Malformed AI output safely caught, original lead data preserved, routed to exception quarantine.\n");

  console.log("All 5 End-to-End Pipeline tests passed successfully!");
}

runPipelineTests().catch((err) => {
  console.error("Pipeline test failed:", err);
  process.exit(1);
});
