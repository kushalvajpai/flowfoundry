async function runTests() {
  const base = process.env.TEST_URL || "http://localhost:3000";
  const results = [];

  async function test(name, fn) {
    try {
      await fn();
      results.push({ name, status: "PASS" });
      console.log("PASS:", name);
    } catch (e) {
      results.push({ name, status: "FAIL", error: e.message });
      console.error("FAIL:", name, e.message);
    }
  }

  // 1. Home page render
  await test("GET / - Home page renders 200 with navbar and pipeline", async () => {
    const res = await fetch(base + "/");
    if (res.status !== 200) throw new Error("Status: " + res.status);
    const html = await res.text();
    if (!html.includes("FlowFoundry")) throw new Error("Missing FlowFoundry");
    if (!html.includes("/audit")) throw new Error("Missing /audit link");
  });

  // 2. Audit page render
  await test("GET /audit - Audit page renders 200 with all form fields", async () => {
    const res = await fetch(base + "/audit");
    if (res.status !== 200) throw new Error("Status: " + res.status);
    const html = await res.text();
    if (!html.includes("Request an Automation Architecture Audit")) throw new Error("Missing heading");
    if (!html.includes("fullName")) throw new Error("Missing fullName input");
    if (!html.includes("biggestProblem")) throw new Error("Missing biggestProblem input");
  });

  // 3. Thank-you page render
  await test("GET /thank-you - Thank you confirmation page renders 200", async () => {
    const res = await fetch(base + "/thank-you");
    if (res.status !== 200) throw new Error("Status: " + res.status);
    const html = await res.text();
    if (!html.includes("Diagnostic Intake Received")) throw new Error("Missing confirmation text");
  });

  // 4. API Valid Submission
  const validLead = {
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
    additionalInformation: "Looking for SOC-2 compliance."
  };

  await test("POST /api/leads - Valid lead submission returns 200 success", async () => {
    const res = await fetch(base + "/api/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(validLead)
    });
    if (res.status !== 200) throw new Error("Expected 200 got " + res.status);
    const json = await res.json();
    if (!json.success || json.message !== "Lead received successfully") {
      throw new Error("Unexpected body: " + JSON.stringify(json));
    }
  });

  // 5. API Valid with domain without https://
  await test("POST /api/leads - Valid lead with plain domain returns 200", async () => {
    const res = await fetch(base + "/api/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...validLead, website: "vancedynamics.com" })
    });
    if (res.status !== 200) throw new Error("Expected 200 got " + res.status);
    const json = await res.json();
    if (!json.success) throw new Error("Failed with plain domain");
  });

  // 6. API Malformed JSON
  await test("POST /api/leads - Malformed JSON returns 400", async () => {
    const res = await fetch(base + "/api/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: '{"broken json: invalid'
    });
    if (res.status !== 400) throw new Error("Expected 400 got " + res.status);
    const json = await res.json();
    if (json.success !== false) throw new Error("Should return success: false");
  });

  // 7. API Empty body
  await test("POST /api/leads - Empty body returns 400", async () => {
    const res = await fetch(base + "/api/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}"
    });
    if (res.status !== 400) throw new Error("Expected 400 got " + res.status);
    const json = await res.json();
    if (json.success !== false) throw new Error("Should return success: false");
  });

  // 8. API Invalid email
  await test("POST /api/leads - Invalid email returns 400 with errors.email", async () => {
    const res = await fetch(base + "/api/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...validLead, email: "not-an-email" })
    });
    if (res.status !== 400) throw new Error("Expected 400 got " + res.status);
    const json = await res.json();
    if (json.success !== false || !json.errors || !json.errors.email) {
      throw new Error("Missing errors.email in " + JSON.stringify(json));
    }
  });

  // 9. API Missing required fields
  await test("POST /api/leads - Missing required fields returns 400 with field errors", async () => {
    const res = await fetch(base + "/api/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "test@example.com" })
    });
    if (res.status !== 400) throw new Error("Expected 400 got " + res.status);
    const json = await res.json();
    if (json.success !== false || !json.errors?.fullName || !json.errors?.companyName) {
      throw new Error("Expected missing field errors in " + JSON.stringify(json));
    }
  });

  // 10. API Invalid URL
  await test("POST /api/leads - Invalid URL returns 400 with errors.website", async () => {
    const res = await fetch(base + "/api/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...validLead, website: "http:// broken spaces" })
    });
    if (res.status !== 400) throw new Error("Expected 400 got " + res.status);
    const json = await res.json();
    if (json.success !== false || !json.errors || !json.errors.website) {
      throw new Error("Expected errors.website in " + JSON.stringify(json));
    }
  });

  const fails = results.filter((r) => r.status === "FAIL");
  if (fails.length > 0) {
    console.error(`\nFAILED: ${fails.length} / ${results.length} tests failed.`);
    process.exit(1);
  } else {
    console.log(`\nSUCCESS: ALL ${results.length} TESTS PASSED CLEANLY.`);
    process.exit(0);
  }
}

runTests();
