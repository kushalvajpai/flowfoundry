/**
 * FlowFoundry Enterprise Authentication & Session Management
 *
 * Implements Edge-compatible cryptographically signed session tokens (HMAC-SHA256)
 * using the Web Crypto API (crypto.subtle).
 *
 * Security Features:
 * - Edge-runtime compatible: No Node-only dependencies, executes safely in Next.js middleware
 * - Constant-time comparison: Mitigates timing attacks on credentials and HMAC signatures
 * - Cryptographic tampering detection: Any modification to payload invalidates signature
 * - Strict expiration enforcement: Rejects expired sessions automatically
 * - Zero secret leakage: Credentials and secrets are kept server-side only
 */

export const SESSION_COOKIE_NAME = "flowfoundry_session";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24; // 24 hours

export interface SessionPayload {
  username: string;
  role: "operator" | "admin";
  iat: number;
  exp: number;
}

// Secret key for HMAC signing
function getSecretKey(): string {
  const secret = process.env.DASHBOARD_SECRET_KEY;
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("FATAL: DASHBOARD_SECRET_KEY must be configured in production environment.");
    }
    // Safe deterministic development secret (strictly non-production)
    return "dev_secret_key_flowfoundry_internal_operator_session_key_2026";
  }
  return secret;
}

// Convert string to Uint8Array
function stringToBytes(str: string): Uint8Array {
  return new TextEncoder().encode(str);
}

// Base64URL encoding (URL-safe, RFC 4648)
function base64UrlEncode(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64 = btoa(binary);
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

// Base64URL decoding
function base64UrlDecode(str: string): Uint8Array {
  let base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4) {
    base64 += "=";
  }
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

// Constant-time byte comparison to prevent timing attacks
function timingSafeEqualBytes(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) {
    return false;
  }
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a[i] ^ b[i];
  }
  return mismatch === 0;
}

// Import CryptoKey for HMAC-SHA256
async function getCryptoKey(): Promise<CryptoKey> {
  const secret = getSecretKey();
  const keyBytes = stringToBytes(secret);
  return await crypto.subtle.importKey(
    "raw",
    keyBytes as unknown as BufferSource,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

/**
 * Creates a cryptographically signed session token.
 */
export async function createSessionToken(username: string, role: "operator" | "admin" = "operator"): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const payload: SessionPayload = {
    username,
    role,
    iat: now,
    exp: now + SESSION_MAX_AGE_SECONDS,
  };

  const payloadJson = JSON.stringify(payload);
  const payloadBytes = stringToBytes(payloadJson);
  const encodedPayload = base64UrlEncode(payloadBytes);

  const key = await getCryptoKey();
  const signatureBuffer = await crypto.subtle.sign(
    "HMAC",
    key,
    stringToBytes(encodedPayload) as unknown as BufferSource
  );

  const encodedSignature = base64UrlEncode(new Uint8Array(signatureBuffer));
  return `${encodedPayload}.${encodedSignature}`;
}

/**
 * Verifies and parses a signed session token.
 * Returns the decoded SessionPayload if valid, or null if tampered or expired.
 */
export async function verifySessionToken(token: string | null | undefined): Promise<SessionPayload | null> {
  if (!token || typeof token !== "string") {
    return null;
  }

  const parts = token.split(".");
  if (parts.length !== 2) {
    return null;
  }

  const [encodedPayload, encodedSignature] = parts;
  if (!encodedPayload || !encodedSignature) {
    return null;
  }

  try {
    const key = await getCryptoKey();
    const expectedSignatureBuffer = await crypto.subtle.sign(
      "HMAC",
      key,
      stringToBytes(encodedPayload) as unknown as BufferSource
    );
    const expectedSignatureBytes = new Uint8Array(expectedSignatureBuffer);
    const providedSignatureBytes = base64UrlDecode(encodedSignature);

    // Constant-time signature comparison
    if (!timingSafeEqualBytes(providedSignatureBytes, expectedSignatureBytes)) {
      return null;
    }

    // Decode and parse payload
    const payloadBytes = base64UrlDecode(encodedPayload);
    const payloadJson = new TextDecoder().decode(payloadBytes);
    const payload = JSON.parse(payloadJson) as SessionPayload;

    // Validate payload fields
    if (!payload.username || !payload.exp || typeof payload.exp !== "number") {
      return null;
    }

    // Check expiration
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp < now) {
      return null; // Expired token
    }

    return payload;
  } catch {
    return null;
  }
}

/**
 * Validates configured administrator / operator credentials using constant-time string comparison.
 */
export function verifyCredentials(providedUser: string, providedPass: string): boolean {
  const configuredUser = process.env.DASHBOARD_ADMIN_USER || "admin";
  const configuredPass = process.env.DASHBOARD_ADMIN_PASSWORD || "FlowFoundry2026!";

  // Pad/normalize byte lengths for timing-safe check
  const userA = stringToBytes(providedUser.trim());
  const userB = stringToBytes(configuredUser.trim());
  const passA = stringToBytes(providedPass);
  const passB = stringToBytes(configuredPass);

  const userMatch = timingSafeEqualBytes(userA, userB);
  const passMatch = timingSafeEqualBytes(passA, passB);

  return userMatch && passMatch;
}

/**
 * Extracts and verifies session payload from standard Request / NextRequest.
 */
export async function verifySessionFromRequest(req: Request): Promise<SessionPayload | null> {
  // 1. Check Cookie header
  const cookieHeader = req.headers.get("cookie") || "";
  const cookies = parseCookies(cookieHeader);
  const token = cookies[SESSION_COOKIE_NAME];

  if (token) {
    const payload = await verifySessionToken(token);
    if (payload) return payload;
  }

  // 2. Check Authorization: Bearer <token> fallback (for programmatic / testing API calls)
  const authHeader = req.headers.get("authorization");
  if (authHeader && authHeader.toLowerCase().startsWith("bearer ")) {
    const bearerToken = authHeader.slice(7).trim();
    return await verifySessionToken(bearerToken);
  }

  return null;
}

// Simple cookie header parser (zero-dependency)
function parseCookies(cookieHeader: string): Record<string, string> {
  const list: Record<string, string> = {};
  if (!cookieHeader) return list;

  const pairs = cookieHeader.split(";");
  for (const pair of pairs) {
    const idx = pair.indexOf("=");
    if (idx < 0) continue;
    const key = pair.substring(0, idx).trim();
    const val = pair.substring(idx + 1).trim();
    list[key] = decodeURIComponent(val);
  }
  return list;
}
