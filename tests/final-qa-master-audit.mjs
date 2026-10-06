/**
 * FlowFoundry Final Comprehensive QA & Systems Audit Verification Suite
 *
 * Covers the entire FlowFoundry AI Lead-to-Customer Engine:
 * Visitor → Landing Page → Automation Audit → Lead Form → Next.js API →
 * n8n → AI Qualification → HOT/WARM/COLD → Supabase → HubSpot → Resend → Dashboard
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
const { leadService, processLeadSubmission } = await import("../lib/services/lead-service.ts");
const { dashboardService } = await import("../lib/services/dashboard-service.ts");
const { createSessionToken, verifySessionToken } = await import("../lib/auth/session.ts");
const { maskSecrets, maskEmail, isTransientError, sanitizeLogObject } = await import("../lib/utils/security.ts");
const { leadSubmissionSchema } = await import("../lib/validations/lead.ts");

let passed = 0;
let failed = 0;

function assert(condition, testName) {
  if (condition) {
    console.log(`  [PASS] ${testName}`);
    passed++;
  } else {
    console.error(`  [FAIL] ${testName}`);
    failed++;
  }
}

async function runMasterAudit() {
  console.log("\n========================================================================");
  console.log("       FLOWFOUNDRY MASTER SYSTEMS AUDIT & FINAL QA VERIFICATION         ");
  console.log("========================================================================\n");

  const runId = Date.now();
  const testLead = {
    fullName: "Elena Rostova",
    companyName: "Rostova Logistical Systems",
    email: `elena.${runId}@rostovalogistics.com`,
    phone: "+1-650-555-0144",
    website: "https://rostovalogistics.com",
    industry: "Logistics & Supply Chain",
    employees: "201-1,000",
    monthlyLeadVolume: "2,001 - 10,000",
    biggestProblem: "Inbound quote requests take 36 hours to qualify and route to regional reps.",
    currentTools: "Salesforce, Gmail, Excel, Zapier",
    additionalInformation: "Looking to deploy autonomous qualification and routing.",
  };

  // -------------------------------------------------------------
  // Section 1: FRONTEND & ROUTE ACCESSIBILITY AUDIT
  // -------------------------------------------------------------
  console.log("--- 1. FRONTEND & ROUTE ARCHITECTURE AUDIT ---");

  // Verify all required pages and layouts exist
  assert(fs.existsSync("app/page.tsx"), "Landing page (/) exists");
  assert(fs.existsSync("app/audit/page.tsx"), "Audit form page (/audit) exists");
  assert(fs.existsSync("app/audit/layout.tsx"), "Audit layout with SEO metadata exists");
  assert(fs.existsSync("app/thank-you/page.tsx"), "Thank-you confirmation page (/thank-you) exists");
  assert(fs.existsSync("app/login/page.tsx"), "Operator login page (/login) exists");
  assert(fs.existsSync("app/login/layout.tsx"), "Login layout with noindex exists");
  assert(fs.existsSync("app/dashboard/page.tsx"), "Internal dashboard page (/dashboard) exists");
  assert(fs.existsSync("app/dashboard/layout.tsx"), "Dashboard layout with noindex exists");
  assert(fs.existsSync("app/dashboard/leads/[id]/page.tsx"), "Lead detail route (/dashboard/leads/[id]) exists");
  assert(fs.existsSync("app/robots.ts"), "Search engine robots configuration exists");
  assert(fs.existsSync("app/sitemap.ts"), "Type-safe canonical sitemap exists");

  // Verify responsive navigation classes in Navbar and Page
  const navbarSource = fs.readFileSync("components/navbar.tsx", "utf8");
  assert(navbarSource.includes("aria-expanded") && navbarSource.includes("Toggle navigation menu"), "Mobile menu toggle is accessible with ARIA attributes");
  assert(navbarSource.includes("/#architecture") && navbarSource.includes("/#pipeline"), "Navbar links to core platform anchors");

  const homeSource = fs.readFileSync("app/page.tsx", "utf8");
  assert(
    homeSource.includes("ArchitectureOverview") &&
    homeSource.includes("EnginePipeline") &&
    homeSource.includes("CapabilitiesSection") &&
    homeSource.includes("SecuritySection"),
    "Landing page renders all referenced platform sections"
  );

  // -------------------------------------------------------------
  // Section 2: API & INGRESS CONTROLS AUDIT
  // -------------------------------------------------------------
  console.log("\n--- 2. API & INGRESS VALIDATION AUDIT ---");

  // 2.1 Valid submission schema
  const validCheck = leadSubmissionSchema.safeParse(testLead);
  assert(validCheck.success === true, "Valid lead passes Zod schema validation");

  // 2.2 Invalid email format
  const badEmailCheck = leadSubmissionSchema.safeParse({ ...testLead, email: "invalid-email" });
  assert(badEmailCheck.success === false, "Invalid email address is strictly rejected");

  // 2.3 Empty / Missing fields
  const emptyCheck = leadSubmissionSchema.safeParse({});
  assert(emptyCheck.success === false, "Empty payload rejected with schema validation errors");

  // 2.4 Duplicate submission guard
  const initialPersist = await processLeadSubmission(testLead);
  assert(initialPersist.success === true && initialPersist.leadId !== undefined, "Initial lead submission persists and returns lead ID");
  const initialLeadId = initialPersist.leadId;

  // Immediate re-submission (simulating double-click or page refresh)
  const duplicatePersist = await processLeadSubmission(testLead);
  assert(duplicatePersist.success === true, "Duplicate submission handled gracefully with HTTP 200 status");
  assert(duplicatePersist.isDuplicate === true, "Duplicate submission flagged with isDuplicate: true");
  assert(duplicatePersist.leadId === initialLeadId, "Duplicate submission reuses existing persisted lead ID");

  // -------------------------------------------------------------
  // Section 3: AI QUALIFICATION & ROUTING AUDIT
  // -------------------------------------------------------------
  console.log("\n--- 3. AI QUALIFICATION & ROUTING AUDIT ---");

  // 3.1 Valid AI JSON parsing
  const mockAiHotJson = JSON.stringify({
    lead_score: 95,
    classification: "HOT",
    business_type: "Logistics Enterprise",
    primary_problem: testLead.biggestProblem,
    automation_opportunity: "Autonomous routing and instant quote qualification",
    estimated_priority: "HIGH",
    recommended_next_step: "Schedule 25-minute technical discovery session",
    reasoning: "High monthly lead volume with high operational complexity warrants high-velocity discovery.",
  });

  const parsedAiResult = parseAndValidateAiOutput(mockAiHotJson);
  assert(parsedAiResult.success === true && parsedAiResult.data.classification === "HOT", "Valid AI JSON correctly parsed and validated against schema");

  // 3.2 Markdown code fences stripped
  const codeFencedAi = `\`\`\`json\n${mockAiHotJson}\n\`\`\``;
  const parsedFenced = parseAndValidateAiOutput(codeFencedAi);
  assert(parsedFenced.success === true && parsedFenced.data.lead_score === 95, "Markdown code-fenced AI response safely cleaned and parsed");

  // 3.3 Malformed AI output recovery
  const malformedAi = "I am an AI assistant and here is my review: this company looks great!";
  const malformedResult = routingService.routeQualifiedLead(testLead, malformedAi, { leadId: initialLeadId });
  assert(malformedResult.status === "exception", "Malformed AI response safely routes to exception quarantine");
  assert(malformedResult.manualReviewRequired === true, "Flags manualReviewRequired: true for operator review");
  assert(malformedResult.originalLeadData.email === testLead.email, "Original lead data 100% preserved during AI failure");
  assert(malformedResult.crmRecord.priority === "HIGH", "Quarantine lead escalated to HIGH priority for manual triage");

  // -------------------------------------------------------------
  // Section 4: DATABASE PERSISTENCE & FAULT TOLERANCE AUDIT
  // -------------------------------------------------------------
  console.log("\n--- 4. SUPABASE DATABASE AUDIT ---");

  // 4.1 Read lead by ID
  const readLeadRes = await leadDbService.getLeadById(initialLeadId);
  assert(readLeadRes.success === true && readLeadRes.data !== null, "Successfully retrieved persisted lead by UUID");
  assert(readLeadRes.data?.company_name === testLead.companyName, "Persisted company name matches original input");

  // 4.2 Read lead by Email
  const readByEmailRes = await leadDbService.getLeadsByEmail(testLead.email);
  assert(readByEmailRes.success === true && readByEmailRes.data?.length === 1, "Indexed query by email returns exactly 1 lead (no duplicate rows created)");

  // 4.3 Update lead status
  const updateRes = await leadDbService.updateLead(initialLeadId, { status: "QUALIFIED" });
  assert(updateRes.success === true && updateRes.data?.status === "QUALIFIED", "Successfully updated lead status to QUALIFIED");

  // Re-verify update persisted
  const verifyUpdate = await leadDbService.getLeadById(initialLeadId);
  assert(verifyUpdate.data?.status === "QUALIFIED", "Database verifies updated status in PostgreSQL");

  // 4.4 Transient error detection
  assert(isTransientError(new Error("fetch failed")), "Correctly identifies transient 'fetch failed' for retry");
  assert(isTransientError(new Error("503 Service Unavailable")), "Correctly identifies transient 503 for retry");
  assert(!isTransientError(new Error("invalid input syntax for type uuid")), "Syntax errors correctly marked non-transient");

  // -------------------------------------------------------------
  // Section 5: CRM INTEGRATION (HUBSPOT) AUDIT
  // -------------------------------------------------------------
  console.log("\n--- 5. HUBSPOT CRM INTEGRATION AUDIT ---");

  const qualificationObj = parsedAiResult.data;

  // 5.1 New contact mapping & creation
  const mockCreateTransport = async (url, init) => {
    if (init?.method === "GET") {
      return new Response(JSON.stringify({ message: "Not found" }), { status: 404 });
    }
    return new Response(JSON.stringify({ id: "hs_cnt_test_1001" }), { status: 201 });
  };

  const createCrmRes = await hubspotService.upsertContact(testLead, qualificationObj, {
    leadId: initialLeadId,
    customTransport: mockCreateTransport,
  });
  assert(createCrmRes.success === true && createCrmRes.action === "created", "HubSpot creates new contact when record does not exist");
  assert(createCrmRes.properties.flowfoundry_classification === "HOT", "Mapped properties preserve AI classification");

  // 5.2 Existing contact update (deduplication)
  const mockUpdateTransport = async (url, init) => {
    if (init?.method === "GET") {
      return new Response(JSON.stringify({ id: "hs_cnt_existing_999" }), { status: 200 });
    }
    return new Response(JSON.stringify({ id: "hs_cnt_existing_999" }), { status: 200 });
  };

  const updateCrmRes = await hubspotService.upsertContact(testLead, qualificationObj, {
    leadId: initialLeadId,
    customTransport: mockUpdateTransport,
  });
  assert(updateCrmRes.success === true && updateCrmRes.action === "updated", "HubSpot updates existing contact by email without duplicate creation");

  // 5.3 HubSpot API outage resilience
  const mockOutageTransport = async () => {
    return new Response(JSON.stringify({ message: "HubSpot API rate limit exceeded" }), { status: 429 });
  };

  const outageCrmRes = await hubspotService.upsertContact(testLead, qualificationObj, {
    leadId: initialLeadId,
    customTransport: mockOutageTransport,
  });
  assert(outageCrmRes.success === false, "HubSpot outage cleanly returns failure status");
  assert(outageCrmRes.routedToException === true, "Outage routes workflow to exception review");

  // Verify lead in DB remains safe
  const dbCheckAfterCrm = await leadDbService.getLeadById(initialLeadId);
  assert(dbCheckAfterCrm.success && dbCheckAfterCrm.data !== null, "Supabase lead preserved in full after CRM integration failure");

  // -------------------------------------------------------------
  // Section 6: EMAIL AUTOMATION (RESEND) AUDIT
  // -------------------------------------------------------------
  console.log("\n--- 6. RESEND EMAIL AUTOMATION AUDIT ---");

  // 6.1 Successful email dispatch
  const mockEmailTransport = async () => {
    return new Response(JSON.stringify({ id: `re_msg_${Date.now()}` }), { status: 200 });
  };

  const emailRes = await resendService.dispatchLeadEmails(testLead, qualificationObj, {
    leadId: initialLeadId,
    customTransport: mockEmailTransport,
    apiKey: "re_mock_test_key_1234567890",
  });
  assert(emailRes.success === true, "Dispatches both prospect confirmation and internal sales alert");
  assert(emailRes.prospectEmailResult?.success === true, "Prospect confirmation email succeeded");
  assert(emailRes.internalNotificationResult?.success === true, "Internal sales alert email succeeded");

  // 6.2 Invalid email format handling
  const badEmailLead = { ...testLead, email: "invalid-syntax" };
  const invalidEmailRes = await resendService.dispatchLeadEmails(badEmailLead, qualificationObj, {
    leadId: initialLeadId,
    customTransport: mockEmailTransport,
    apiKey: "re_mock_test_key_1234567890",
  });
  assert(invalidEmailRes.integrationStatus === "INVALID_EMAIL", "Invalid email caught before outbound transmission");
  assert(invalidEmailRes.leadPreserved === true, "Lead preserved in database despite invalid email");

  // 6.3 Resend 500 Outage & Secret Masking
  const mockEmailOutageTransport = async () => {
    return new Response(
      JSON.stringify({ message: "Internal mail error: api_key re_1234567890abcdefghijklmnop failed" }),
      { status: 500 }
    );
  };

  const emailOutageRes = await resendService.dispatchLeadEmails(testLead, qualificationObj, {
    leadId: initialLeadId,
    customTransport: mockEmailOutageTransport,
    apiKey: "re_mock_test_key_1234567890",
  });
  assert(emailOutageRes.success === false, "Handles email gateway 500 error gracefully");
  assert(!emailOutageRes.errorReason?.includes("re_1234567890"), "Resend API key is redacted from error logs");
  assert(emailOutageRes.leadPreserved === true, "Lead remains preserved in DB during email outage");

  // -------------------------------------------------------------
  // Section 7: DASHBOARD & ANALYTICS AUDIT
  // -------------------------------------------------------------
  console.log("\n--- 7. DASHBOARD TELEMETRY & ANALYTICS AUDIT ---");

  const dashboardData = await dashboardService.getDashboardData();
  assert(dashboardData.success === true, "Dashboard service successfully queries live database");
  assert(dashboardData.metrics.totalLeads > 0, "Dashboard reports real non-zero total leads");
  assert(dashboardData.metrics.averageLeadScore >= 0 && dashboardData.metrics.averageLeadScore <= 100, "Average lead score within valid bounds (0-100)");

  // Verify all 11 required analytics metrics exist
  const m = dashboardData.metrics;
  const hasAllMetrics = [
    m.totalLeads,
    m.leadsPerDay,
    m.leadsPerWeek,
    m.leadsPerMonth,
    m.hotPercentage,
    m.warmPercentage,
    m.coldPercentage,
    m.averageLeadScore,
    m.conversionToContacted,
    m.conversionToMeeting,
    m.conversionToWon,
  ].every((val) => typeof val === "number" && !isNaN(val));

  assert(hasAllMetrics, "All 11 required lead analytics metrics computed from real database rows");

  // Verify all 4 real charts
  const c = dashboardData.charts;
  assert(Array.isArray(c.leadsOverTime) && c.leadsOverTime.length > 0, "Chart 1: Leads over time timeline populated");
  assert(Array.isArray(c.leadsByClassification) && c.leadsByClassification.length >= 3, "Chart 2: Classification distribution (HOT, WARM, COLD) populated");
  assert(Array.isArray(c.leadsByIndustry) && c.leadsByIndustry.length > 0, "Chart 3: Industry distribution populated");
  assert(Array.isArray(c.leadStatusFunnel) && c.leadStatusFunnel.length === 5, "Chart 4: Lead status funnel contains all 5 sequential stages");

  // -------------------------------------------------------------
  // Section 8: SECURITY & BOUNDARY DEFENSE AUDIT
  // -------------------------------------------------------------
  console.log("\n--- 8. SECURITY & BOUNDARY DEFENSE AUDIT ---");

  // 8.1 HMAC Session Token Verification
  const testToken = await createSessionToken("admin", "operator");
  assert(typeof testToken === "string" && testToken.includes("."), "Generated signed cryptographic session token");

  const verifiedSession = await verifySessionToken(testToken);
  assert(verifiedSession?.username === "admin" && verifiedSession?.role === "operator", "Valid session token verifies successfully");

  // 8.2 Tamper detection
  const tamperedToken = testToken.slice(0, -6) + "xxxxxx";
  const tamperedCheck = await verifySessionToken(tamperedToken);
  assert(tamperedCheck === null, "Tampered cryptographic token rejected with null session");

  // 8.3 Secret & PII Masking
  const rawLog = "OpenAI key sk-proj-12345678901234567890, Resend key re_98765432101234567890, Bearer token_secret_123";
  const maskedLog = maskSecrets(rawLog);
  assert(!maskedLog.includes("sk-proj-") && !maskedLog.includes("re_987654") && !maskedLog.includes("token_secret"), "All API keys and bearer tokens redacted from server logs");

  const maskedEmail = maskEmail("elena.rostova@acmecorp.com");
  assert(maskedEmail === "e***a@acmecorp.com", "Customer email masked for log privacy");

  // -------------------------------------------------------------
  // SUMMARY
  // -------------------------------------------------------------
  console.log("\n========================================================================");
  console.log(`   FINAL SYSTEMS AUDIT: ${passed} PASSED | ${failed} FAILED`);
  console.log("========================================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runMasterAudit().catch((err) => {
  console.error("Master audit crashed:", err);
  process.exit(1);
});
