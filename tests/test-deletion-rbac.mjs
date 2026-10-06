/**
 * Automated Verification: Database Deletion with Role-Based Access Control and Password Protection
 */

import fs from "node:fs";

// Load environment variables
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

const { leadDbService } = await import("../lib/services/lead-db-service.ts");
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "FlowFoundryAdmin2026!";

async function runRbacDeletionTests() {
  console.log("================================================================================");
  console.log(" RBAC & PASSWORD PROTECTED DATABASE DELETION VERIFICATION");
  console.log("================================================================================\n");

  // Step 1: Create a synthetic test lead
  const testLeadRes = await leadDbService.createLead({
    full_name: "RBAC Deletion Test Subject",
    company_name: "Temporary Test Corp",
    email: `rbac.delete.test.${Date.now()}@tempcorp.internal`,
    industry: "B2B SaaS / Software",
    employees: "11-50",
    monthly_lead_volume: "100 - 500",
    biggest_problem: "Testing delete permissions and password safety",
    current_tools: "Internal Test",
  });

  if (!testLeadRes.success || !testLeadRes.data) {
    throw new Error(`Failed to create synthetic test lead: ${testLeadRes.error}`);
  }

  const testLeadId = testLeadRes.data.id;
  console.log(`[PASS] Created test lead: ${testLeadId} (${testLeadRes.data.email})\n`);

  // Step 2: Customer Logic Test (must fail with 403)
  console.log("Test 1: Customer Role attempting deletion...");
  const customerRes = await fetch("http://localhost:3000/api/admin/leads/delete", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      role: "customer",
      password: ADMIN_PASSWORD,
      action: "delete_single",
      leadId: testLeadId,
    }),
  });

  const customerJson = await customerRes.json();
  if (customerRes.status === 403 && customerJson.code === "FORBIDDEN_CUSTOMER_ROLE") {
    console.log("  [PASS] Customer request blocked with 403 Forbidden:", customerJson.error);
  } else {
    throw new Error(`Customer test failed: status=${customerRes.status}, body=${JSON.stringify(customerJson)}`);
  }

  // Step 3: Admin Logic with Incorrect Password Test (must fail with 401)
  console.log("\nTest 2: Admin Role with Incorrect Password...");
  const badPwdRes = await fetch("http://localhost:3000/api/admin/leads/delete", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      role: "admin",
      password: "WRONG_UNAUTHORIZED_PASSWORD",
      action: "delete_single",
      leadId: testLeadId,
    }),
  });

  const badPwdJson = await badPwdRes.json();
  if (badPwdRes.status === 401 && badPwdJson.code === "INVALID_ADMIN_PASSWORD") {
    console.log("  [PASS] Invalid password blocked with 401 Unauthorized:", badPwdJson.error);
  } else {
    throw new Error(`Bad password test failed: status=${badPwdRes.status}, body=${JSON.stringify(badPwdJson)}`);
  }

  // Step 4: Admin Purge without "DELETE" Confirmation phrase (must fail with 400)
  console.log("\nTest 3: Admin Database Purge without confirmation phrase...");
  const purgeNoConfirmRes = await fetch("http://localhost:3000/api/admin/leads/delete", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      role: "admin",
      password: ADMIN_PASSWORD,
      action: "purge_all",
      confirmationText: "accidental_click",
    }),
  });

  const purgeNoConfirmJson = await purgeNoConfirmRes.json();
  if (purgeNoConfirmRes.status === 400 && purgeNoConfirmJson.code === "CONFIRMATION_REQUIRED") {
    console.log("  [PASS] Accidental purge prevented with 400 Bad Request:", purgeNoConfirmJson.error);
  } else {
    throw new Error(`Purge guard failed: status=${purgeNoConfirmRes.status}, body=${JSON.stringify(purgeNoConfirmJson)}`);
  }

  // Step 5: Admin Logic with Correct Password -> Single Lead Deletion
  console.log("\nTest 4: Admin Role with Correct Password deleting test lead...");
  const validDeleteRes = await fetch("http://localhost:3000/api/admin/leads/delete", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      role: "admin",
      password: ADMIN_PASSWORD,
      action: "delete_single",
      leadId: testLeadId,
    }),
  });

  const validDeleteJson = await validDeleteRes.json();
  if (validDeleteRes.status === 200 && validDeleteJson.success === true) {
    console.log("  [PASS] Successfully deleted lead record:", validDeleteJson.message);
  } else {
    throw new Error(`Valid deletion failed: status=${validDeleteRes.status}, body=${JSON.stringify(validDeleteJson)}`);
  }

  // Step 6: Verify lead is permanently gone from Supabase DB
  console.log("\nTest 5: Verifying lead is removed from PostgreSQL database...");
  const checkDeleted = await leadDbService.getLeadById(testLeadId);
  if (!checkDeleted.success || checkDeleted.data === null) {
    console.log("  [PASS] Confirmed: Lead does not exist in database.");
  } else {
    throw new Error(`Lead still exists in database: ${JSON.stringify(checkDeleted.data)}`);
  }

  console.log("\n================================================================================");
  console.log(" ALL RBAC & PASSWORD PROTECTION DELETION TESTS PASSED SUCCESSFULLY");
  console.log("================================================================================");
}

runRbacDeletionTests().catch((err) => {
  console.error("\n[FAIL] Test harness error:", err);
  process.exit(1);
});
