import http from "http";

async function runEndToEndN8nTest() {
  console.log("=== End-to-End n8n Webhook Forwarding Test ===");

  const MOCK_N8N_PORT = 5678;
  const NEXT_PORT = 3000;
  let receivedPayload = null;
  let mockStatus = 200;

  // 1. Mock n8n Webhook Receiver
  const mockN8nServer = http.createServer((req, res) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
    });
    req.on("end", () => {
      try {
        receivedPayload = JSON.parse(body);
      } catch {
        receivedPayload = body;
      }

      res.writeHead(mockStatus, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ status: "acknowledged", id: "n8n_exec_123" }));
    });
  });

  await new Promise((resolve) => mockN8nServer.listen(MOCK_N8N_PORT, resolve));
  console.log(`Mock n8n listener running on port ${MOCK_N8N_PORT}`);

  const validLead = {
    fullName: "Bruce Wayne",
    companyName: "Wayne Enterprises",
    email: "bruce@wayneenterprises.com",
    phone: "+1-555-0100",
    website: "https://wayneenterprises.com",
    industry: "Manufacturing & Logistics",
    employees: "1,000+",
    monthlyLeadVolume: "10,000+",
    biggestProblem: "Legacy CRM synchronization lag is causing 24-hour turnaround bottlenecks on inbound procurement requests.",
    currentTools: "Salesforce Sales Cloud, SAP, Custom ERP",
    additionalInformation: "Strict data sovereignty and custom VPC routing required.",
  };

  try {
    // TEST 1: Submit lead to Next.js API
    console.log("\n[Test 1] Dispatching valid lead to POST /api/leads...");
    mockStatus = 200;
    receivedPayload = null;

    const res = await fetch(`http://localhost:${NEXT_PORT}/api/leads`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(validLead),
    });

    const json = await res.json();
    console.log("Next.js response status:", res.status);
    console.log("Next.js response body:", json);

    if (res.status !== 200 || !json.success || json.message !== "Lead received successfully") {
      throw new Error("Failed test 1: Next.js API did not return success 200");
    }

    if (!receivedPayload) {
      throw new Error("Failed test 1: Mock n8n server did not receive payload!");
    }

    // Verify all 11 fields
    const requiredKeys = [
      "fullName", "companyName", "email", "phone", "website",
      "industry", "employees", "monthlyLeadVolume", "biggestProblem",
      "currentTools", "additionalInformation"
    ];

    for (const key of requiredKeys) {
      if (receivedPayload[key] === undefined) {
        throw new Error(`Missing expected key in n8n payload: ${key}`);
      }
    }

    console.log("✔ PASS: n8n received exact 11 fields matching payload contract.");

    // TEST 2: n8n failure (HTTP 500 from n8n)
    console.log("\n[Test 2] Simulating n8n upstream failure (HTTP 500)...");
    mockStatus = 500;
    receivedPayload = null;

    const failRes = await fetch(`http://localhost:${NEXT_PORT}/api/leads`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(validLead),
    });

    const failJson = await failRes.json();
    console.log("Next.js response on upstream failure:", failRes.status, failJson);

    if (failRes.status !== 502 && failRes.status !== 500) {
      throw new Error(`Expected 502/500 got ${failRes.status}`);
    }

    if (failJson.success !== false || failJson.message !== "Unable to process your request") {
      throw new Error(`Unexpected failure response: ${JSON.stringify(failJson)}`);
    }

    // Ensure error response never leaks webhook URL
    const stringified = JSON.stringify(failJson);
    if (stringified.includes("5678") || stringified.includes("webhook")) {
      throw new Error("Security leak: webhook endpoint leaked in response!");
    }

    console.log("✔ PASS: Upstream failure masked properly without exposing URL or secrets.");

    // TEST 3: Invalid Form Input
    console.log("\n[Test 3] Submitting invalid form (missing company)...");
    receivedPayload = null;
    const invalidRes = await fetch(`http://localhost:${NEXT_PORT}/api/leads`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...validLead, companyName: "" }),
    });

    const invalidJson = await invalidRes.json();
    console.log("Next.js response on invalid input:", invalidRes.status, invalidJson);

    if (invalidRes.status !== 400 || invalidJson.success !== false) {
      throw new Error("Expected 400 validation error");
    }

    if (receivedPayload !== null) {
      throw new Error("Invalid request was incorrectly forwarded to n8n!");
    }

    console.log("✔ PASS: Invalid form rejected at API layer before reaching n8n.");

    console.log("\n=======================================================");
    console.log("ALL E2E n8n WEBHOOK FORWARDING TESTS PASSED PERFECTLY!");
    console.log("=======================================================");
  } finally {
    mockN8nServer.close();
  }
}

runEndToEndN8nTest().catch((err) => {
  console.error("Test error:", err.message);
  process.exit(1);
});
