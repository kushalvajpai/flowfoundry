import assert from "node:assert/strict";
import fs from "node:fs";

// Load environment variables from .env.local natively if present
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

// Import resendService
const { resendService, validateEmail, maskSecrets } = await import(
  "../lib/services/resend-service.ts"
);

async function runResendTests() {
  console.log("=== FlowFoundry Resend Email Automation Test Suite ===\n");

  const baseLead = {
    fullName: "Marcus Brody",
    companyName: "Apex Logistics Corp",
    email: "marcus@apexlogistics.io",
    phone: "+1-312-555-0188",
    website: "https://apexlogistics.io",
    industry: "Logistics & Supply Chain",
    employees: "201-500",
    monthlyLeadVolume: "2,001 - 5,000",
    biggestProblem:
      "Freight quote requests take 3 hours to calculate manually, losing deals to competitors.",
    currentTools: "Salesforce, Google Sheets, Custom ERP",
    additionalInformation: "Need automated routing to 4 regional dispatch hubs.",
  };

  // -------------------------------------------------------------
  // Test 1: HOT Lead — Lead Confirmation & Internal Sales Alert
  // -------------------------------------------------------------
  console.log("Test 1: HOT Lead — Lead Confirmation & Internal Sales Alert");
  const hotQualification = {
    lead_score: 94,
    classification: "HOT",
    business_type: "Mid-Market Enterprise Logistics",
    primary_problem: "Manual 3-hour quote calculation cycle causing massive deal decay",
    automation_opportunity: "Autonomous dispatch quoting engine with real-time rate card API",
    estimated_priority: "HIGH",
    recommended_next_step: "Schedule 25-minute architecture discovery session",
    reasoning: "High quote volume (2001-5000/mo) coupled with acute latency pain is an optimal fit for automation.",
  };

  const hotEmailsCaptured = [];
  const hotMockTransport = async (url, options) => {
    const body = JSON.parse(options.body);
    hotEmailsCaptured.push(body);
    return new Response(JSON.stringify({ id: `re_msg_${Date.now()}_${hotEmailsCaptured.length}` }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  };

  const res1 = await resendService.dispatchLeadEmails(baseLead, hotQualification, {
    leadId: "lead_test_hot_1",
    customTransport: hotMockTransport,
    apiKey: "re_mock_valid_key_12345678901234567890",
    salesEmail: "sales@flowfoundry.io",
  });

  assert.equal(res1.success, true, "HOT lead email dispatch must succeed");
  assert.equal(res1.integrationStatus, "SENT");
  assert.equal(res1.leadPreserved, true);
  assert.equal(hotEmailsCaptured.length, 2, "Must send exactly 2 emails (Confirmation + Internal Alert)");

  // Verify EMAIL 1: Prospect Confirmation
  const email1Hot = hotEmailsCaptured.find((e) => e.to.includes("marcus@apexlogistics.io"));
  assert.ok(email1Hot, "Must dispatch Email 1 to submitted lead email");
  assert.equal(email1Hot.subject, "Automation Audit Request Received — FlowFoundry");
  assert.ok(email1Hot.text.includes("Marcus"), "Confirmation must address prospect by first name");
  assert.ok(email1Hot.text.includes("Apex Logistics Corp"), "Confirmation must name prospect company");
  assert.ok(email1Hot.text.includes("discovery session"), "HOT confirmation must include discovery call invitation");

  // Verify EMAIL 2: Internal Sales Alert with all required fields
  const email2Hot = hotEmailsCaptured.find((e) => e.to.includes("sales@flowfoundry.io"));
  assert.ok(email2Hot, "Must dispatch Email 2 to sales team email");
  assert.ok(email2Hot.subject.includes("NEW HOT LEAD"), "Subject must highlight NEW HOT LEAD");
  assert.ok(email2Hot.text.includes("NEW HOT LEAD"), "Body must contain 'NEW HOT LEAD'");
  assert.ok(email2Hot.text.includes("Apex Logistics Corp"), "Must contain Company");
  assert.ok(email2Hot.text.includes("Marcus Brody"), "Must contain Contact");
  assert.ok(email2Hot.text.includes("marcus@apexlogistics.io"), "Must contain Contact email");
  assert.ok(email2Hot.text.includes("+1-312-555-0188"), "Must contain Contact phone");
  assert.ok(email2Hot.text.includes("94/100"), "Must contain Lead Score");
  assert.ok(email2Hot.text.includes("HOT"), "Must contain Classification");
  assert.ok(email2Hot.text.includes(hotQualification.primary_problem), "Must contain Primary Problem");
  assert.ok(email2Hot.text.includes(hotQualification.automation_opportunity), "Must contain Automation Opportunity");
  assert.ok(email2Hot.text.includes(hotQualification.recommended_next_step), "Must contain Recommended Next Step");

  console.log("✓ PASS: HOT lead generated both emails with all required fields (NEW HOT LEAD, Company, Contact, Score, Problem, Opportunity, Next Step).\n");

  // -------------------------------------------------------------
  // Test 2: WARM Lead — Appropriate Notification Rules
  // -------------------------------------------------------------
  console.log("Test 2: WARM Lead — Lead Confirmation & Appropriate Notification Rules");
  const warmQualification = {
    lead_score: 68,
    classification: "WARM",
    business_type: "Regional Logistics Provider",
    primary_problem: "Slow manual data entry from customer emails into dispatch ERP",
    automation_opportunity: "Email parser webhook to auto-populate freight dispatch orders",
    estimated_priority: "MEDIUM",
    recommended_next_step: "Review operational workflow and send technical case study",
    reasoning: "Moderate volume with repetitive data entry; fits standard automation blueprint.",
  };

  const warmEmailsCaptured = [];
  const warmMockTransport = async (url, options) => {
    const body = JSON.parse(options.body);
    warmEmailsCaptured.push(body);
    return new Response(JSON.stringify({ id: `re_warm_${Date.now()}` }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  };

  const res2 = await resendService.dispatchLeadEmails(baseLead, warmQualification, {
    leadId: "lead_test_warm_2",
    customTransport: warmMockTransport,
    apiKey: "re_mock_valid_key_12345678901234567890",
  });

  assert.equal(res2.success, true);
  assert.equal(res2.integrationStatus, "SENT");
  assert.equal(warmEmailsCaptured.length, 2);

  const email1Warm = warmEmailsCaptured.find((e) => e.to.includes("marcus@apexlogistics.io"));
  assert.ok(email1Warm.text.includes("24 to 48 business hours"), "WARM confirmation must state 24-48h review timeline");

  const email2Warm = warmEmailsCaptured.find((e) => e.to.includes("sales@flowfoundry.io"));
  assert.ok(email2Warm.subject.includes("NEW WARM LEAD"));
  assert.ok(email2Warm.text.includes("NEW WARM LEAD"));
  assert.ok(email2Warm.text.includes("Review within 24-48 business hours"), "WARM internal notification must state SLA");

  console.log("✓ PASS: WARM lead executed with appropriate 24-48h notification rules.\n");

  // -------------------------------------------------------------
  // Test 3: COLD Lead — Appropriate Notification Rules
  // -------------------------------------------------------------
  console.log("Test 3: COLD Lead — Resource Confirmation & Low-Touch Notification Rules");
  const coldQualification = {
    lead_score: 28,
    classification: "COLD",
    business_type: "Solo Brokerage",
    primary_problem: "Occasional paperwork organization",
    automation_opportunity: "Self-service document templates",
    estimated_priority: "LOW",
    recommended_next_step: "Add to monthly automation insights newsletter",
    reasoning: "Low volume and simple operations; below enterprise engagement threshold.",
  };

  const coldEmailsCaptured = [];
  const coldMockTransport = async (url, options) => {
    const body = JSON.parse(options.body);
    coldEmailsCaptured.push(body);
    return new Response(JSON.stringify({ id: `re_cold_${Date.now()}` }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  };

  const res3 = await resendService.dispatchLeadEmails(baseLead, coldQualification, {
    leadId: "lead_test_cold_3",
    customTransport: coldMockTransport,
    apiKey: "re_mock_valid_key_12345678901234567890",
  });

  assert.equal(res3.success, true);
  assert.equal(res3.integrationStatus, "SENT");
  assert.equal(coldEmailsCaptured.length, 2);

  const email1Cold = coldEmailsCaptured.find((e) => e.to.includes("marcus@apexlogistics.io"));
  assert.ok(email1Cold.text.includes("https://flowfoundry.io/resources"), "COLD confirmation must link to self-service resources");

  const email2Cold = coldEmailsCaptured.find((e) => e.to.includes("sales@flowfoundry.io"));
  assert.ok(email2Cold.subject.includes("COLD / NURTURE"));
  assert.ok(email2Cold.text.includes("Enrolled in educational nurture campaign"), "COLD notification must reflect low-touch nurture");

  console.log("✓ PASS: COLD lead executed with educational resources and low-touch nurture notification.\n");

  // -------------------------------------------------------------
  // Test 4: Invalid Email Handling
  // -------------------------------------------------------------
  console.log("Test 4: Invalid Email Handling — Validation Guard & Lead Preservation");
  const invalidEmailLead = {
    ...baseLead,
    email: "not-a-valid-email-format",
  };

  assert.equal(validateEmail(invalidEmailLead.email), false, "Validation helper must detect invalid email");

  const invalidEmailsCaptured = [];
  const invalidEmailTransport = async (url, options) => {
    const body = JSON.parse(options.body);
    invalidEmailsCaptured.push(body);
    return new Response(JSON.stringify({ id: `re_invalid_alert_${Date.now()}` }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  };

  const res4 = await resendService.dispatchLeadEmails(invalidEmailLead, hotQualification, {
    leadId: "lead_test_invalid_4",
    customTransport: invalidEmailTransport,
    apiKey: "re_mock_valid_key_12345678901234567890",
  });

  assert.equal(res4.success, false, "Must report unsuccessful dispatch due to invalid email");
  assert.equal(res4.integrationStatus, "INVALID_EMAIL", "Must flag integration status as INVALID_EMAIL");
  assert.equal(res4.prospectEmailResult.success, false, "Must not attempt to send confirmation to invalid email");
  assert.equal(res4.leadPreserved, true, "Lead must be preserved in database");

  // Verify internal warning was sent to sales instead of crashing
  const warningEmail = invalidEmailsCaptured.find((e) => e.to.includes("sales@flowfoundry.io"));
  assert.ok(warningEmail, "Internal sales alert must still be sent to flag invalid contact info");
  assert.ok(warningEmail.subject.includes("[INVALID EMAIL]"), "Internal subject must indicate invalid email");

  console.log("✓ PASS: Malformed email safely caught, confirmation skipped, sales alerted, lead preserved in DB.\n");

  // -------------------------------------------------------------
  // Test 5: Resend Failure — Graceful Recovery & Zero Data Loss
  // -------------------------------------------------------------
  console.log("Test 5: Resend Failure — Graceful Error Catching & Zero Data Loss");
  const failingTransport = async () => {
    return new Response(
      JSON.stringify({
        message: "Internal server error connecting to upstream mail gateway: api_key re_prod_secret_token_123456789 failed",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  };

  const res5 = await resendService.dispatchLeadEmails(baseLead, hotQualification, {
    leadId: "lead_test_fail_5",
    customTransport: failingTransport,
    apiKey: "re_mock_test_key_which_fails_upstream_123",
  });

  assert.equal(res5.success, false, "Must report failure");
  assert.equal(res5.integrationStatus, "FAILED");
  assert.equal(res5.leadPreserved, true, "Lead must be preserved despite API failure");
  assert.ok(res5.errorReason, "Must provide sanitized error reason");

  // Check secret masking
  assert.ok(
    !res5.errorReason.includes("re_prod_secret_token_123456789"),
    "Sensitive Resend API keys must be masked from error descriptions"
  );
  assert.ok(
    res5.errorReason.includes("[REDACTED_RESEND_KEY]"),
    "Masked placeholder must appear in sanitized logs"
  );

  console.log("✓ PASS: Resend 500 failure handled gracefully, tokens masked, lead safely preserved in database.\n");

  console.log("All 5 Resend Email Automation tests passed successfully!");
}

runResendTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
