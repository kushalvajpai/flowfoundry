import assert from "node:assert/strict";
import { routeQualifiedLead, parseAndValidateAiOutput } from "../lib/services/routing-service.ts";

async function runRoutingTests() {
  console.log("=== FlowFoundry Routing Stage Test Suite ===\n");

  const sampleLead = {
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

  // Test 1: HOT Lead Routing
  console.log("Test 1: HOT Lead Routing");
  const hotAiOutput = {
    lead_score: 92,
    classification: "HOT",
    business_type: "Mid-market B2B SaaS",
    primary_problem: "High-latency manual lead qualification causing lead decay",
    automation_opportunity: "Autonomous AI-driven ingestion and HubSpot CRM deal routing",
    estimated_priority: "HIGH",
    recommended_next_step: "Book a 25-minute technical discovery session to review architectural requirements",
    reasoning: "High lead volume (501-2000/mo) coupled with severe qualification latency (45 min/lead) and existing HubSpot stack represents immediate high-ROI automation opportunity.",
  };

  const hotResult = routeQualifiedLead(sampleLead, hotAiOutput);
  assert.equal(hotResult.status, "routed");
  assert.equal(hotResult.classification, "HOT");
  assert.equal(hotResult.priority, "HIGH");
  assert.equal(hotResult.nextWorkflow, "discovery_call");
  assert.ok(hotResult.crmRecord, "CRM record must exist");
  assert.equal(hotResult.crmRecord.qualification.score, 92);
  assert.equal(hotResult.crmRecord.qualification.reasoning, hotAiOutput.reasoning);
  assert.ok(hotResult.internalNotification, "Internal notification must be dispatched for HOT lead");
  assert.equal(hotResult.internalNotification.urgency, "IMMEDIATE");
  assert.equal(hotResult.internalNotification.targetChannel, "sales_alerts_high_priority");
  assert.ok(hotResult.prospectEmail, "Prospect confirmation email must be generated");
  assert.equal(hotResult.prospectEmail.templateType, "hot_discovery_invitation");
  assert.ok(hotResult.prospectEmail.copy.callToAction?.label.includes("Discovery Session"));
  // Verify non-aggressive communication
  assert.ok(!hotResult.prospectEmail.copy.body?.includes("BUY NOW"));
  assert.ok(!hotResult.prospectEmail.copy.acknowledgment.includes("urgent discount"));
  console.log("✓ PASS: HOT lead correctly configured with CRM record, immediate internal alert, discovery call recommendation, and priority HIGH.\n");

  // Test 2: WARM Lead Routing
  console.log("Test 2: WARM Lead Routing");
  const warmAiOutput = JSON.stringify({
    lead_score: 65,
    classification: "WARM",
    business_type: "Growth-stage B2B Agency",
    primary_problem: "Data enrichment discrepancies between spreadsheets and CRM",
    automation_opportunity: "Scheduled bi-directional sync and normalization pipeline",
    estimated_priority: "MEDIUM",
    recommended_next_step: "Conduct asynchronous stack review and schedule standard follow-up",
    reasoning: "Moderate lead volume with clear workflow friction in data hygiene. High potential value once stack is clarified.",
  });

  const warmResult = routeQualifiedLead(sampleLead, warmAiOutput);
  assert.equal(warmResult.status, "routed");
  assert.equal(warmResult.classification, "WARM");
  assert.equal(warmResult.priority, "MEDIUM");
  assert.equal(warmResult.nextWorkflow, "follow_up");
  assert.equal(warmResult.internalNotification, undefined, "No high-priority internal alert for WARM lead");
  assert.ok(warmResult.prospectEmail, "Prospect confirmation email must exist");
  assert.equal(warmResult.prospectEmail.templateType, "warm_intake_acknowledgment");
  assert.ok(warmResult.prospectEmail.copy.nextSteps.includes("24 to 48 business hours"));
  console.log("✓ PASS: WARM lead correctly marked MEDIUM priority, enrolled in follow-up workflow, with respectful confirmation.\n");

  // Test 3: COLD Lead Routing
  console.log("Test 3: COLD Lead Routing");
  const coldAiOutput = {
    lead_score: 25,
    classification: "COLD",
    business_type: "Early-stage single operator",
    primary_problem: "Exploring general automation tools",
    automation_opportunity: "Self-service automation templates and documentation",
    estimated_priority: "LOW",
    recommended_next_step: "Provide educational resources and add to long-term newsletter",
    reasoning: "Very low volume and exploratory interest; does not match enterprise custom architecture threshold at this stage.",
  };

  const coldResult = routeQualifiedLead(sampleLead, coldAiOutput);
  assert.equal(coldResult.status, "routed");
  assert.equal(coldResult.classification, "COLD");
  assert.equal(coldResult.priority, "LOW");
  assert.equal(coldResult.nextWorkflow, "nurture");
  assert.equal(coldResult.internalNotification, undefined);
  assert.ok(coldResult.prospectEmail, "Confirmation email must be sent where appropriate");
  assert.equal(coldResult.prospectEmail.templateType, "cold_resource_acknowledgment");
  assert.ok(coldResult.prospectEmail.copy.callToAction?.url.includes("/resources"));
  console.log("✓ PASS: COLD lead correctly marked LOW priority, assigned to nurture workflow, with educational resource confirmation.\n");

  // Test 4: Malformed AI Output (Invalid JSON string)
  console.log("Test 4: Malformed AI Output (Unparseable String)");
  const malformedString = "THIS IS NOT JSON {{{ invalid <<<";
  const exceptionResult1 = routeQualifiedLead(sampleLead, malformedString, { leadId: "lead_err_1" });
  assert.equal(exceptionResult1.status, "exception");
  assert.equal(exceptionResult1.manualReviewRequired, true);
  assert.ok(exceptionResult1.errorReason.includes("JSON"));
  // Verify complete preservation of original lead data
  assert.deepEqual(exceptionResult1.originalLeadData, sampleLead);
  assert.equal(exceptionResult1.crmRecord.status, "review_required");
  assert.equal(exceptionResult1.internalAlert.targetChannel, "engineering_and_operations");
  console.log("✓ PASS: Unparseable AI string caught safely, original lead data preserved, routed to exception quarantine.\n");

  // Test 5: Malformed AI Output (Missing Required Fields & Invalid Schema)
  console.log("Test 5: Malformed AI Output (Missing Required Fields)");
  const invalidSchema = {
    lead_score: 150, // Out of bounds (0-100)
    classification: "SUPER_HOT", // Invalid enum
    // missing business_type, primary_problem, etc.
  };
  const exceptionResult2 = routeQualifiedLead(sampleLead, invalidSchema);
  assert.equal(exceptionResult2.status, "exception");
  assert.equal(exceptionResult2.manualReviewRequired, true);
  assert.ok(exceptionResult2.errorReason.includes("schema violation"));
  assert.deepEqual(exceptionResult2.originalLeadData, sampleLead);
  console.log("✓ PASS: Schema violations caught safely, original lead preserved, routed to exception path.\n");

  // Test 6: AI Output with Markdown Code Fence
  console.log("Test 6: AI Output wrapped in Markdown Code Fences (```json ... ```)");
  const fencedAiOutput = `\`\`\`json\n${JSON.stringify(hotAiOutput)}\n\`\`\``;
  const fencedResult = routeQualifiedLead(sampleLead, fencedAiOutput);
  assert.equal(fencedResult.status, "routed");
  assert.equal(fencedResult.classification, "HOT");
  console.log("✓ PASS: Markdown-fenced JSON automatically sanitized and routed correctly.\n");

  console.log("All 6 Lead Routing tests passed successfully!");
}

runRoutingTests().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
