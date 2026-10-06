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

// Import dashboardService
const { dashboardService } = await import("../lib/services/dashboard-service.ts");
const { leadDbService } = await import("../lib/services/lead-db-service.ts");

async function runDashboardTests() {
  console.log("=== FlowFoundry Real Database Dashboard Test Suite ===\n");

  // Step 1: Ensure diverse real test data exists in Supabase PostgreSQL
  console.log("Step 1: Checking and Seeding Real Database Leads (No Fake Data)...");

  // Seed representative leads if not already present
  const seedLeads = [
    {
      full_name: "Elena Vance",
      company_name: "Vance Dynamics",
      email: "elena@vancedynamics.com",
      phone: "+1-555-0199",
      website: "https://vancedynamics.com",
      industry: "B2B SaaS / Software",
      employees: "51-200",
      monthly_lead_volume: "501 - 2,000",
      biggest_problem: "Manual qualification takes 45 min per lead causing deal drop-off",
      current_tools: "HubSpot, Zapier, Google Sheets",
      lead_score: 95,
      classification: "HOT",
      business_type: "Mid-Market B2B SaaS",
      primary_problem: "High-latency manual lead qualification",
      automation_opportunity: "Autonomous AI-driven ingestion and HubSpot CRM deal routing",
      status: "QUALIFIED",
      estimated_priority: "HIGH",
    },
    {
      full_name: "Marcus Brody",
      company_name: "Apex Logistics Corp",
      email: "marcus@apexlogistics.io",
      phone: "+1-312-555-0188",
      website: "https://apexlogistics.io",
      industry: "Logistics & Supply Chain",
      employees: "201-500",
      monthly_lead_volume: "2,001 - 5,000",
      biggest_problem: "Freight quote calculation cycle takes 3 hours manually",
      current_tools: "Salesforce, Google Sheets, Custom ERP",
      lead_score: 92,
      classification: "HOT",
      business_type: "Mid-Market Enterprise Logistics",
      primary_problem: "Slow freight quoting calculations causing deal decay",
      automation_opportunity: "Autonomous dispatch quoting engine with real-time rate card API",
      status: "MEETING_BOOKED",
      estimated_priority: "HIGH",
    },
    {
      full_name: "Sarah Chen",
      company_name: "HealthBridge Analytics",
      email: "sarah@healthbridge.med",
      phone: "+1-415-555-0144",
      website: "https://healthbridge.med",
      industry: "Healthcare & Life Sciences",
      employees: "11-50",
      monthly_lead_volume: "101 - 500",
      biggest_problem: "HIPAA compliance documentation takes too long to verify",
      current_tools: "Airtable, HubSpot",
      lead_score: 68,
      classification: "WARM",
      business_type: "Digital Health Provider",
      primary_problem: "Manual compliance document verification",
      automation_opportunity: "Secure document parsing workflow with audit logs",
      status: "CONTACTED",
      estimated_priority: "MEDIUM",
    },
    {
      full_name: "David Kim",
      company_name: "FinPulse Payments",
      email: "david@finpulse.io",
      phone: "+1-212-555-0133",
      website: "https://finpulse.io",
      industry: "FinTech & Financial Services",
      employees: "51-200",
      monthly_lead_volume: "501 - 2,000",
      biggest_problem: "Customer onboarding verification has 4-day backlogs",
      current_tools: "Stripe, Zendesk, Salesforce",
      lead_score: 96,
      classification: "HOT",
      business_type: "Payments Infrastructure",
      primary_problem: "Multi-day onboarding review backlogs",
      automation_opportunity: "Automated KYC identity matching and webhook verification",
      status: "WON",
      estimated_priority: "HIGH",
    },
    {
      full_name: "Arthur Pendelton",
      company_name: "Pendelton Crafts",
      email: "arthur@pendeltoncrafts.org",
      industry: "E-Commerce & Retail",
      employees: "1-10",
      monthly_lead_volume: "1 - 50",
      biggest_problem: "Need occasional invoice organization",
      current_tools: "QuickBooks Online",
      lead_score: 25,
      classification: "COLD",
      business_type: "Micro Retailer",
      primary_problem: "Basic accounting file organization",
      automation_opportunity: "Standard self-service invoice export template",
      status: "NEW",
      estimated_priority: "LOW",
    },
  ];

  for (const seed of seedLeads) {
    const existing = await leadDbService.getLeadsByEmail(seed.email);
    if (!existing.data || existing.data.length === 0) {
      await leadDbService.createLead(seed);
      console.log(`  + Seeded real database record for ${seed.company_name} (${seed.email})`);
    }
  }

  // -------------------------------------------------------------
  // Test 1: Real Database Metrics Verification (All 9 Metrics)
  // -------------------------------------------------------------
  console.log("\nTest 1: Global Pipeline Metrics Calculation");
  const dashboardData = await dashboardService.getDashboardData();

  assert.equal(dashboardData.success, true, "Dashboard fetch must succeed");
  const m = dashboardData.metrics;

  console.log("  * Total Leads:", m.totalLeads);
  console.log("  * HOT Leads:", m.hotLeads);
  console.log("  * WARM Leads:", m.warmLeads);
  console.log("  * COLD Leads:", m.coldLeads);
  console.log("  * Average Lead Score:", m.averageLeadScore);
  console.log("  * New Leads:", m.newLeads);
  console.log("  * Contacted Leads:", m.contactedLeads);
  console.log("  * Meetings Booked:", m.meetingsBooked);
  console.log("  * Won Leads:", m.wonLeads);

  assert.ok(m.totalLeads > 0, "Total leads must be > 0");
  assert.ok(m.hotLeads >= 1, "Must have real HOT leads");
  assert.ok(m.warmLeads >= 1, "Must have real WARM leads");
  assert.ok(m.coldLeads >= 1, "Must have real COLD leads");
  assert.ok(m.averageLeadScore > 0, "Average lead score must be calculated");
  assert.ok(m.newLeads >= 1, "Must have real NEW leads");
  assert.ok(m.contactedLeads >= 1, "Must have real CONTACTED leads");
  assert.ok(m.meetingsBooked >= 1, "Must have real MEETING_BOOKED leads");
  assert.ok(m.wonLeads >= 1, "Must have real WON leads");
  console.log("✓ PASS: All 9 metrics computed accurately from real database rows.\n");

  // -------------------------------------------------------------
  // Test 2: Real Database Charts Data Verification (All 4 Charts)
  // -------------------------------------------------------------
  console.log("Test 2: Visual Charts Distributions & Trends");
  const c = dashboardData.charts;

  // Chart 1: Leads Over Time
  assert.ok(Array.isArray(c.leadsOverTime), "Leads over time must be an array");
  assert.ok(c.leadsOverTime.length > 0, "Must contain time-series points");
  assert.ok(c.leadsOverTime[0].total > 0, "Time-series total must reflect counts");
  console.log(`  * Leads over time: ${c.leadsOverTime.length} time points recorded.`);

  // Chart 2: Leads by Classification
  assert.ok(c.leadsByClassification.length >= 3, "Must cover HOT, WARM, COLD tiers");
  const hotChart = c.leadsByClassification.find((item) => item.name === "HOT");
  assert.ok(hotChart && hotChart.count > 0, "HOT chart segment must contain real counts");
  console.log(`  * Classification breakdown: HOT=${hotChart.count} (${hotChart.percentage}%)`);

  // Chart 3: Leads by Industry
  assert.ok(c.leadsByIndustry.length >= 2, "Must aggregate distinct industries");
  console.log(`  * Top Industry: ${c.leadsByIndustry[0].name} (${c.leadsByIndustry[0].count} leads)`);

  // Chart 4: Lead Status Distribution
  assert.ok(c.leadStatusDistribution.length >= 4, "Must cover pipeline statuses");
  console.log(`  * Status distribution: ${c.leadStatusDistribution.map((s) => `${s.name}:${s.count}`).join(", ")}`);

  console.log("✓ PASS: All 4 charts populated with real database distributions.\n");

  // -------------------------------------------------------------
  // Test 3: Table Search Capabilities (Name, Company, Email)
  // -------------------------------------------------------------
  console.log("Test 3: Lead Search Functionality");

  // Search by Name
  const nameSearch = await dashboardService.getDashboardData({ search: "Marcus" });
  assert.ok(nameSearch.leads.some((l) => l.full_name.includes("Marcus")), "Must find lead by name");
  console.log(`  * Search by name 'Marcus': Found ${nameSearch.leads.length} record(s)`);

  // Search by Company
  const companySearch = await dashboardService.getDashboardData({ search: "HealthBridge" });
  assert.ok(companySearch.leads.some((l) => l.company_name.includes("HealthBridge")), "Must find lead by company");
  console.log(`  * Search by company 'HealthBridge': Found ${companySearch.leads.length} record(s)`);

  // Search by Email
  const emailSearch = await dashboardService.getDashboardData({ search: "finpulse.io" });
  assert.ok(emailSearch.leads.some((l) => l.email.includes("finpulse.io")), "Must find lead by email");
  console.log(`  * Search by email 'finpulse.io': Found ${emailSearch.leads.length} record(s)`);

  console.log("✓ PASS: Search functionality verified for Name, Company, and Email.\n");

  // -------------------------------------------------------------
  // Test 4: Filtering Capabilities (Classification, Industry, Status, Date)
  // -------------------------------------------------------------
  console.log("Test 4: Filters Validation");

  // Classification Filter
  const hotFilter = await dashboardService.getDashboardData({ classification: "HOT" });
  assert.ok(hotFilter.leads.every((l) => l.classification === "HOT"), "All returned leads must be HOT");
  console.log(`  * Classification filter 'HOT': ${hotFilter.leads.length} leads returned`);

  // Industry Filter
  const indFilter = await dashboardService.getDashboardData({ industry: "Logistics & Supply Chain" });
  assert.ok(indFilter.leads.every((l) => l.industry === "Logistics & Supply Chain"), "Industry filter must match");
  console.log(`  * Industry filter 'Logistics & Supply Chain': ${indFilter.leads.length} leads returned`);

  // Status Filter
  const statusFilter = await dashboardService.getDashboardData({ status: "MEETING_BOOKED" });
  assert.ok(statusFilter.leads.every((l) => l.status === "MEETING_BOOKED"), "Status filter must match");
  console.log(`  * Status filter 'MEETING_BOOKED': ${statusFilter.leads.length} leads returned`);

  // Date Range Filter
  const dateFilter = await dashboardService.getDashboardData({ dateRange: "30d" });
  assert.ok(dateFilter.leads.length > 0, "Date filter 30d must return recent records");
  console.log(`  * Date range filter '30d': ${dateFilter.leads.length} leads returned`);

  console.log("✓ PASS: Classification, Industry, Status, and Date Range filters verified.\n");

  // -------------------------------------------------------------
  // Test 5: Empty State Verification (No Matching Leads)
  // -------------------------------------------------------------
  console.log("Test 5: Empty State Handling");
  const emptyFilter = await dashboardService.getDashboardData({
    search: "NonExistentCompanyOrPerson12345XYZ",
  });
  assert.equal(emptyFilter.leads.length, 0, "Must return 0 records for non-existent search query");
  assert.equal(emptyFilter.totalFilteredCount, 0);
  console.log("✓ PASS: Empty state properly reports 0 matching records without throwing.\n");

  // -------------------------------------------------------------
  // Test 6: Status Update Mutation Test
  // -------------------------------------------------------------
  console.log("Test 6: Real-time Status Mutation");
  const testLead = dashboardData.leads[0];
  const initialStatus = testLead.status;
  const targetStatus = initialStatus === "NEW" ? "CONTACTED" : "NEW";

  const updateRes = await dashboardService.updateLeadStatus(testLead.id, targetStatus);
  assert.equal(updateRes.success, true, "Status update must succeed");

  // Verify DB updated
  const reloaded = await leadDbService.getLeadById(testLead.id);
  assert.equal(reloaded.data?.status, targetStatus, "Lead status in DB must reflect update");

  // Revert back
  await dashboardService.updateLeadStatus(testLead.id, initialStatus);
  console.log(`✓ PASS: Status transition (${initialStatus} -> ${targetStatus} -> ${initialStatus}) executed and verified in DB.\n`);

  console.log("All Dashboard Test Scenarios Passed Successfully!");
}

runDashboardTests().catch((err) => {
  console.error("Dashboard test suite failed:", err);
  process.exit(1);
});
