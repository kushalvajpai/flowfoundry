/**
 * FlowFoundry Reliability & Security Utilities
 *
 * Provides:
 * - Secret and credential masking for safe logging and error telemetry
 * - Data sanitization to avoid leaking PII and sensitive parameters
 * - Transient error identification for retry workflows
 */

/**
 * Strips sensitive API keys, tokens, and credentials from strings.
 */
export function maskSecrets(input: string): string {
  if (!input || typeof input !== "string") return "";
  return input
    .replace(/re_[a-zA-Z0-9_]{15,}/g, "[REDACTED_RESEND_KEY]")
    .replace(/sk-[a-zA-Z0-9_\-]{20,}/g, "[REDACTED_OPENAI_KEY]")
    .replace(/pat-[a-zA-Z0-9_\-]{15,}/g, "[REDACTED_HUBSPOT_TOKEN]")
    .replace(/eyJ[a-zA-Z0-9_\-\.]{30,}/g, "[REDACTED_JWT_TOKEN]")
    .replace(/Bearer\s+[a-zA-Z0-9_\-\.]+/gi, "Bearer [REDACTED_TOKEN]")
    .replace(/(?:password|secret|apiKey|api_key|token)["':\s=]+([^"',\s}&]+)/gi, "$1=[REDACTED]");
}

/**
 * Masks an email address for privacy-safe logs (e.g. j***e@example.com).
 */
export function maskEmail(email: string): string {
  if (!email || !email.includes("@")) return "masked@unknown.com";
  const [local, domain] = email.split("@");
  if (!local || local.length <= 2) {
    return `*@${domain}`;
  }
  return `${local[0]}***${local[local.length - 1]}@${domain}`;
}

/**
 * Masks a phone number (e.g. ***-***-1234).
 */
export function maskPhone(phone?: string | null): string {
  if (!phone) return "N/A";
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 4) return "[REDACTED_PHONE]";
  return `***-***-${digits.slice(-4)}`;
}

/**
 * Determines whether an error is transient (temporary network glitch, timeout, 502/503/504)
 * and therefore safe to retry.
 */
export function isTransientError(error: unknown): boolean {
  if (!error) return false;
  const msg = error instanceof Error ? error.message : String(error);
  const name = error instanceof Error ? error.name : "";

  return (
    name === "TimeoutError" ||
    name === "AbortError" ||
    msg.includes("fetch failed") ||
    msg.includes("network timeout") ||
    msg.includes("ETIMEDOUT") ||
    msg.includes("ECONNRESET") ||
    msg.includes("ECONNREFUSED") ||
    msg.includes("socket hang up") ||
    msg.includes("502") ||
    msg.includes("503") ||
    msg.includes("504") ||
    msg.includes("Rate limit") ||
    msg.includes("429")
  );
}

/**
 * Sanitizes an object before serialization to console or log aggregators.
 */
export function sanitizeLogObject(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  const sensitiveKeys = new Set([
    "password",
    "token",
    "secret",
    "apikey",
    "api_key",
    "authorization",
    "cookie",
    "jwt",
    "servicerolekey",
    "anonkey",
  ]);

  for (const [key, value] of Object.entries(obj)) {
    if (sensitiveKeys.has(key.toLowerCase())) {
      result[key] = "[REDACTED]";
    } else if (key === "email" && typeof value === "string") {
      result[key] = maskEmail(value);
    } else if (key === "phone" && typeof value === "string") {
      result[key] = maskPhone(value);
    } else if (typeof value === "string") {
      result[key] = maskSecrets(value);
    } else if (value && typeof value === "object" && !Array.isArray(value)) {
      result[key] = sanitizeLogObject(value as Record<string, unknown>);
    } else {
      result[key] = value;
    }
  }

  return result;
}
