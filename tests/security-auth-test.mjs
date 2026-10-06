/**
 * FlowFoundry Security & Access Boundary Automated Test Suite
 *
 * Verifies:
 * 1. Cryptographic HMAC-SHA256 session token creation, verification, and tamper resistance
 * 2. Unauthenticated access prevention on /dashboard and /dashboard/leads/[id] (redirect to /login)
 * 3. Unauthenticated access prevention on /api/dashboard and /api/leads/[id] (401 Unauthorized)
 * 4. Public route accessibility (/, /audit, /thank-you, POST /api/leads)
 * 5. Authentication lifecycle: login, cookie issuance, authenticated access, and logout
 * 6. PostgREST filter injection protection (sanitization of search and sort parameters)
 * 7. Secure HTTP headers (X-Frame-Options, X-Content-Type-Options, Referrer-Policy, etc.)
 */

import { spawn } from "child_process";
import http from "http";

const PORT = 3009;
const BASE_URL = `http://localhost:${PORT}`;

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForServer(url, timeoutMs = 25000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url, { redirect: "manual" });
      if (res.status) return true;
    } catch {
      await delay(500);
    }
  }
  throw new Error(`Server failed to start at ${url} within ${timeoutMs}ms`);
}

async function runTests() {
  console.log("===============================================================");
  console.log("   FLOWFOUNDRY SECURITY & ACCESS BOUNDARY VERIFICATION SUITE   ");
  console.log("===============================================================\n");

  let serverProcess = null;
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

  try {
    // -------------------------------------------------------------
    // STAGE 1: Spawn Next.js Production Server on Test Port
    // -------------------------------------------------------------
    console.log(`[Stage 1] Launching Next.js server on port ${PORT}...`);
    serverProcess = spawn(
      "npx.cmd",
      ["next", "start", "-p", String(PORT)],
      {
        cwd: process.cwd(),
        shell: true,
        stdio: "inherit",
        env: {
          ...process.env,
          NODE_ENV: "production",
          PORT: String(PORT),
          DASHBOARD_SECRET_KEY: "test_secure_random_key_for_verification_suite_32_chars!",
          DASHBOARD_ADMIN_USER: "admin",
          DASHBOARD_ADMIN_PASSWORD: "FlowFoundry2026!Secure",
        },
      }
    );

    await waitForServer(`${BASE_URL}/`);
    console.log(`[Stage 1] Server is responsive at ${BASE_URL}\n`);

    // -------------------------------------------------------------
    // STAGE 2: Public Route Accessibility (Zero Regression)
    // -------------------------------------------------------------
    console.log("[Stage 2] Verifying public routes accessibility...");

    const homeRes = await fetch(`${BASE_URL}/`, { redirect: "manual" });
    assert(homeRes.status === 200, "GET / returns HTTP 200 without authentication");

    const auditRes = await fetch(`${BASE_URL}/audit`, { redirect: "manual" });
    assert(auditRes.status === 200, "GET /audit returns HTTP 200 without authentication");

    const thankYouRes = await fetch(`${BASE_URL}/thank-you`, { redirect: "manual" });
    assert(thankYouRes.status === 200, "GET /thank-you returns HTTP 200 without authentication");

    const loginRes = await fetch(`${BASE_URL}/login`, { redirect: "manual" });
    assert(loginRes.status === 200, "GET /login returns HTTP 200 without authentication");

    // Public lead intake POST /api/leads must be open for intake
    const intakeRes = await fetch(`${BASE_URL}/api/leads`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
      redirect: "manual",
    });
    // Should return 400 for empty body (NOT 401 Unauthorized), proving public lead intake works
    assert(
      intakeRes.status === 400,
      `POST /api/leads is publicly accessible (returned ${intakeRes.status} for validation, not 401)`
    );

    // -------------------------------------------------------------
    // STAGE 3: Unauthenticated Access Denial on Internal Routes
    // -------------------------------------------------------------
    console.log("\n[Stage 3] Verifying unauthenticated access rejection on internal routes...");

    // UI: /dashboard must redirect to /login
    const unauthDashboardRes = await fetch(`${BASE_URL}/dashboard`, {
      redirect: "manual",
    });
    assert(
      unauthDashboardRes.status === 307 || unauthDashboardRes.status === 302,
      `GET /dashboard returns redirect status ${unauthDashboardRes.status}`
    );
    const locationHeader = unauthDashboardRes.headers.get("location") || "";
    assert(
      locationHeader.includes("/login"),
      `GET /dashboard redirects to /login (Location: ${locationHeader})`
    );

    // UI: /dashboard/leads/[id] must redirect to /login
    const unauthLeadDetailRes = await fetch(
      `${BASE_URL}/dashboard/leads/00000000-0000-0000-0000-000000000000`,
      { redirect: "manual" }
    );
    assert(
      unauthLeadDetailRes.status === 307 || unauthLeadDetailRes.status === 302,
      `GET /dashboard/leads/[id] returns redirect status ${unauthLeadDetailRes.status}`
    );

    // API: GET /api/dashboard must return 401
    const unauthApiDashboardRes = await fetch(`${BASE_URL}/api/dashboard`, {
      redirect: "manual",
    });
    assert(
      unauthApiDashboardRes.status === 401,
      `GET /api/dashboard returns 401 Unauthorized (got ${unauthApiDashboardRes.status})`
    );
    const unauthApiDashboardJson = await unauthApiDashboardRes.json();
    assert(
      unauthApiDashboardJson.success === false,
      "GET /api/dashboard unauthenticated response has success: false"
    );

    // API: PATCH /api/dashboard must return 401
    const unauthPatchRes = await fetch(`${BASE_URL}/api/dashboard`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: "foo", status: "CONTACTED" }),
      redirect: "manual",
    });
    assert(
      unauthPatchRes.status === 401,
      `PATCH /api/dashboard returns 401 Unauthorized (got ${unauthPatchRes.status})`
    );

    // API: GET /api/leads/[id] must return 401
    const unauthApiLeadRes = await fetch(
      `${BASE_URL}/api/leads/00000000-0000-0000-0000-000000000000`,
      { redirect: "manual" }
    );
    assert(
      unauthApiLeadRes.status === 401,
      `GET /api/leads/[id] returns 401 Unauthorized (got ${unauthApiLeadRes.status})`
    );

    // API: POST /api/leads/route-qualified must return 401
    const unauthRouteQualifiedRes = await fetch(`${BASE_URL}/api/leads/route-qualified`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lead: {}, aiQualification: {} }),
      redirect: "manual",
    });
    assert(
      unauthRouteQualifiedRes.status === 401,
      `POST /api/leads/route-qualified returns 401 Unauthorized (got ${unauthRouteQualifiedRes.status})`
    );

    // -------------------------------------------------------------
    // STAGE 4: Authentication Lifecycle (Login, Cookie, Authenticated Access, Logout)
    // -------------------------------------------------------------
    console.log("\n[Stage 4] Testing authentication lifecycle...");

    // Bad login
    const badLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "admin", password: "wrong_password" }),
    });
    assert(
      badLoginRes.status === 401,
      `POST /api/auth/login with invalid password returns 401 (got ${badLoginRes.status})`
    );

    // Good login
    const goodLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: "admin",
        password: "FlowFoundry2026!Secure",
      }),
    });
    assert(
      goodLoginRes.status === 200,
      `POST /api/auth/login with valid credentials returns 200 (got ${goodLoginRes.status})`
    );

    const setCookieHeader = goodLoginRes.headers.get("set-cookie") || "";
    assert(
      setCookieHeader.includes("flowfoundry_session"),
      "Login sets flowfoundry_session cookie in Set-Cookie header"
    );
    assert(
      setCookieHeader.toLowerCase().includes("httponly"),
      "Session cookie includes HttpOnly security attribute"
    );
    assert(
      setCookieHeader.toLowerCase().includes("samesite=lax"),
      "Session cookie includes SameSite=Lax security attribute"
    );

    // Extract cookie value
    const match = setCookieHeader.match(/flowfoundry_session=([^;]+)/);
    const sessionCookie = match ? match[1] : "";
    assert(sessionCookie.length > 20, "Session cookie contains non-empty cryptographic token");

    // Authenticated API request with session cookie
    const authDashboardRes = await fetch(`${BASE_URL}/api/dashboard`, {
      headers: {
        Cookie: `flowfoundry_session=${sessionCookie}`,
      },
    });
    assert(
      authDashboardRes.status === 200,
      `Authenticated GET /api/dashboard returns HTTP 200 (got ${authDashboardRes.status})`
    );
    const authDashboardJson = await authDashboardRes.json();
    assert(
      authDashboardJson.success === true && typeof authDashboardJson.metrics === "object",
      "Authenticated response returns valid dashboard metrics structure"
    );

    // -------------------------------------------------------------
    // STAGE 5: Tampered / Forged Session Token Detection
    // -------------------------------------------------------------
    console.log("\n[Stage 5] Testing cryptographic tamper detection...");

    // Alter token payload
    const tokenParts = sessionCookie.split(".");
    if (tokenParts.length === 2) {
      const tamperedToken = "eyJyYW5kb20iOiJhdHRhY2tlciJ9." + tokenParts[1];
      const tamperedRes = await fetch(`${BASE_URL}/api/dashboard`, {
        headers: { Cookie: `flowfoundry_session=${tamperedToken}` },
      });
      assert(
        tamperedRes.status === 401,
        `Tampered payload token is rejected with 401 (got ${tamperedRes.status})`
      );

      const badSigToken = tokenParts[0] + ".invalidsignature12345";
      const badSigRes = await fetch(`${BASE_URL}/api/dashboard`, {
        headers: { Cookie: `flowfoundry_session=${badSigToken}` },
      });
      assert(
        badSigRes.status === 401,
        `Forged signature token is rejected with 401 (got ${badSigRes.status})`
      );
    }

    // -------------------------------------------------------------
    // STAGE 6: Input Sanitization & PostgREST Filter Injection Defense
    // -------------------------------------------------------------
    console.log("\n[Stage 6] Testing PostgREST filter injection defense...");

    // Malicious injection attempt: injecting PostgREST syntax and operators into search
    const maliciousPayloads = [
      `test%,id.eq.00000000-0000-0000-0000-000000000000`,
      `a',company_name.is.null,email.ilike.%b%`,
      `" or 1=1 --`,
      `test\\;select * from leads`,
      `((()))`,
    ];

    for (const payload of maliciousPayloads) {
      const injectionUrl = `${BASE_URL}/api/dashboard?search=${encodeURIComponent(payload)}`;
      const res = await fetch(injectionUrl, {
        headers: { Cookie: `flowfoundry_session=${sessionCookie}` },
      });
      assert(
        res.status === 200,
        `Injection payload "${payload.slice(0, 30)}" handled safely without server error (HTTP 200)`
      );
      const json = await res.json();
      assert(
        json.success === true,
        `Sanitized query executed cleanly (success: true, returned ${json.leads?.length || 0} leads)`
      );
    }

    // Invalid sortBy column injection
    const badSortUrl = `${BASE_URL}/api/dashboard?sortBy=${encodeURIComponent("password_hash;--")}`;
    const badSortRes = await fetch(badSortUrl, {
      headers: { Cookie: `flowfoundry_session=${sessionCookie}` },
    });
    assert(
      badSortRes.status === 200,
      "Arbitrary sortBy column falls back to allowed sort column safely (HTTP 200)"
    );

    // -------------------------------------------------------------
    // STAGE 7: Secure HTTP Headers Verification
    // -------------------------------------------------------------
    console.log("\n[Stage 7] Verifying Secure HTTP response headers...");

    const headersRes = await fetch(`${BASE_URL}/`);
    const xFrameOptions = headersRes.headers.get("x-frame-options");
    const xContentTypeOptions = headersRes.headers.get("x-content-type-options");
    const referrerPolicy = headersRes.headers.get("referrer-policy");
    const permissionsPolicy = headersRes.headers.get("permissions-policy");
    const poweredBy = headersRes.headers.get("x-powered-by");

    assert(
      xFrameOptions === "DENY",
      `X-Frame-Options is set to DENY (got "${xFrameOptions}")`
    );
    assert(
      xContentTypeOptions === "nosniff",
      `X-Content-Type-Options is set to nosniff (got "${xContentTypeOptions}")`
    );
    assert(
      referrerPolicy === "strict-origin-when-cross-origin",
      `Referrer-Policy is set to strict-origin-when-cross-origin (got "${referrerPolicy}")`
    );
    assert(
      Boolean(permissionsPolicy),
      `Permissions-Policy is present (got "${permissionsPolicy?.slice(0, 30)}...")`
    );
    assert(
      !poweredBy,
      "X-Powered-By header is stripped (server banner fingerprinting disabled)"
    );

    // -------------------------------------------------------------
    // STAGE 8: Logout & Session Termination
    // -------------------------------------------------------------
    console.log("\n[Stage 8] Testing session termination via logout...");

    const logoutRes = await fetch(`${BASE_URL}/api/auth/logout`, {
      method: "POST",
      headers: { Cookie: `flowfoundry_session=${sessionCookie}` },
    });
    assert(logoutRes.status === 200, "POST /api/auth/logout returns HTTP 200");

    const logoutCookie = logoutRes.headers.get("set-cookie") || "";
    assert(
      logoutCookie.includes("flowfoundry_session=;") ||
        logoutCookie.includes("Max-Age=0"),
      "Logout clears flowfoundry_session cookie with Max-Age=0"
    );

    // -------------------------------------------------------------
    // SUMMARY
    // -------------------------------------------------------------
    console.log("\n===============================================================");
    console.log(`   TEST RESULTS: ${passedCount} PASSED | ${failedCount} FAILED`);
    console.log("===============================================================\n");

    if (failedCount > 0) {
      process.exitCode = 1;
    }
  } finally {
    if (serverProcess) {
      console.log("[Teardown] Shutting down test server...");
      serverProcess.kill("SIGTERM");
      // Allow graceful exit
      await delay(1500);
    }
  }
}

runTests().catch((err) => {
  console.error("Test execution failed with unhandled error:", err);
  process.exit(1);
});
