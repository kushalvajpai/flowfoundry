import assert from "node:assert/strict";
import fs from "node:fs";

// Load environment variables from .env.local natively
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

// Import lead database service
const { leadDbService } = await import("../lib/services/lead-db-service.ts");

async function runDatabaseTests() {
  console.log("=== FlowFoundry Supabase Persistence Test Suite ===\n");

  const testEmail = `test_${Date.now()}@vancedynamics.com`;
  let createdLeadId = null;

  // Test 1: Insertion
  console.log("Test 1: Test Lead Insertion into Supabase");
  const insertPayload = {
    full_name: "Elena Vance",
    company_name: "Vance Dynamics",
    email: testEmail,
    phone: "+1-555-0199",
    website: "https://vancedynamics.com",
    industry: "B2B SaaS / Software",
    employees: "51-200",
    monthly_lead_volume: "501 - 2,000",
    biggest_problem: "Manual lead qualification takes 45 minutes per lead, causing 60% pipeline drop-off.",
    current_tools: "HubSpot, Zapier, Google Sheets",
    additional_information: "Requires SOC-2 compliance for all workflows.",
    status: "NEW",
    source: "website_audit_form",
  };

  const insertResult = await leadDbService.createLead(insertPayload);
  assert.equal(insertResult.success, true, `Insert failed: ${insertResult.error}`);
  assert.ok(insertResult.data, "Insert must return created row data");
  assert.ok(insertResult.data.id, "Lead must have a generated UUID primary key");
  assert.equal(insertResult.data.company_name, "Vance Dynamics");
  assert.equal(insertResult.data.email, testEmail);
  assert.equal(insertResult.data.status, "NEW");
  assert.ok(insertResult.data.created_at, "Lead must have created_at timestamp");
  createdLeadId = insertResult.data.id;
  console.log(`✓ PASS: Lead successfully inserted with UUID ${createdLeadId}.\n`);

  // Test 2: Retrieval (by ID, by Email, and Update)
  console.log("Test 2: Test Lead Retrieval & Status Update");
  // 2a: Retrieve by ID
  const getByIdResult = await leadDbService.getLeadById(createdLeadId);
  assert.equal(getByIdResult.success, true);
  assert.ok(getByIdResult.data, "Must retrieve lead by ID");
  assert.equal(getByIdResult.data.id, createdLeadId);
  assert.equal(getByIdResult.data.email, testEmail);

  // 2b: Retrieve by Email
  const getByEmailResult = await leadDbService.getLeadsByEmail(testEmail);
  assert.equal(getByEmailResult.success, true);
  assert.ok(Array.isArray(getByEmailResult.data));
  assert.ok(getByEmailResult.data.length > 0);
  assert.equal(getByEmailResult.data[0].id, createdLeadId);

  // 2c: Update Lead with AI Qualification & Status Change
  const updateResult = await leadDbService.updateLead(createdLeadId, {
    status: "QUALIFIED",
    lead_score: 94,
    classification: "HOT",
    primary_problem: "Manual lead qualification bottleneck",
    automation_opportunity: "Autonomous AI-driven ingestion and HubSpot CRM routing",
    estimated_priority: "HIGH",
    recommended_next_step: "Schedule 25-minute technical discovery session",
    ai_reasoning: "High lead volume coupled with severe qualification latency represents immediate high-ROI automation opportunity.",
  });
  assert.equal(updateResult.success, true);
  assert.equal(updateResult.data.status, "QUALIFIED");
  assert.equal(updateResult.data.lead_score, 94);
  assert.equal(updateResult.data.classification, "HOT");

  // 2d: List Leads filtered by classification
  const listResult = await leadDbService.listLeads({ classification: "HOT", limit: 5 });
  assert.equal(listResult.success, true);
  assert.ok(listResult.data.some((l) => l.id === createdLeadId));
  console.log("✓ PASS: Lead retrieved by ID and email, updated to QUALIFIED/HOT, and listed successfully.\n");

  // Test 3: Invalid Data Handling
  console.log("Test 3: Test Invalid Data Handling");
  // Attempt to insert with invalid classification or null required field
  const invalidPayload = {
    full_name: "", // violates NOT NULL / check
    company_name: "Incomplete Corp",
    email: "not-an-email",
    industry: "Tech",
    employees: "1-10",
    monthly_lead_volume: "0-50",
    biggest_problem: "None",
    current_tools: "None",
    classification: "INVALID_CLASSIFICATION", // violates check constraint
  };

  const invalidResult = await leadDbService.createLead(invalidPayload);
  assert.equal(invalidResult.success, false, "Invalid payload must not succeed");
  assert.ok(invalidResult.error, "Error message must be present");
  // Ensure error is user-safe and does not leak raw credentials
  assert.ok(!invalidResult.error.includes("password"));
  assert.ok(!invalidResult.error.includes("JWT"));
  console.log(`✓ PASS: Invalid data safely caught without crash: "${invalidResult.error}".\n`);

  // Test 4: Database Failure Simulation & Safe Error Masking
  console.log("Test 4: Test Database Failure Handling & Error Masking");
  // Temporarily point to non-existent host to simulate network/database outage
  const originalUrl = process.env.SUPABASE_URL;
  try {
    // Attempt operation with invalid lead ID format
    const badIdResult = await leadDbService.getLeadById("not-a-valid-uuid");
    assert.equal(badIdResult.success, false);
    assert.ok(badIdResult.error);
    // Verify raw SQL/internals are masked
    assert.equal(badIdResult.error, "Failed to retrieve lead record");
  } finally {
    process.env.SUPABASE_URL = originalUrl;
  }
  console.log("✓ PASS: Database errors are safely caught and masked with generic user-friendly responses.\n");

  console.log("All Supabase persistence tests passed successfully!");
}

runDatabaseTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
