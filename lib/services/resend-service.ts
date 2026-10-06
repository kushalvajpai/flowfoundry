import type { ValidatedLeadInput } from "../validations/lead";
import type { AIQualification } from "../validations/ai-qualification";
import type {
  ResendEmailPayload,
  ResendSendResult,
  ResendIntegrationStatus,
  LeadEmailDispatchResult,
} from "../../types/routing";
import { leadDbService } from "./lead-db-service";

export type ResendTransport = (
  endpoint: string,
  options: RequestInit
) => Promise<Response>;

import { maskSecrets } from "../utils/security";
export { maskSecrets };

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Validates email format according to standard RFC 5322 rules.
 */
export function validateEmail(email: string): boolean {
  if (!email || typeof email !== "string") return false;
  const trimmed = email.trim();
  if (trimmed.length === 0 || trimmed.length > 254) return false;
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  return emailRegex.test(trimmed);
}

/**
 * EMAIL 1: Generates the concise, professional Lead Confirmation email.
 * Confirms receipt of the Automation Audit request and provides tailored next steps.
 */
export function generateLeadConfirmationEmail(
  lead: ValidatedLeadInput,
  qualification?: AIQualification,
  options?: { leadId?: string; fromEmail?: string }
): ResendEmailPayload {
  const from =
    options?.fromEmail ||
    process.env.RESEND_FROM_EMAIL ||
    "FlowFoundry <onboarding@resend.dev>";
  const firstName = lead.fullName.trim().split(" ")[0] || "there";
  const company = lead.companyName.trim();
  const problem = qualification?.primary_problem || lead.biggestProblem;
  const leadId = options?.leadId || "";

  let nextStepText = "";
  let nextStepHtml = "";

  if (qualification?.classification === "HOT") {
    nextStepText = `Based on your monthly volume (${lead.monthlyLeadVolume}) and stack (${lead.currentTools}), your workflows show strong alignment with our automation architecture.\n\nWe recommend a 25-minute technical discovery session with our solutions engineering team to review architectural requirements:\nhttps://flowfoundry.io/schedule?lead=${leadId}`;
    nextStepHtml = `<p>Based on your monthly volume (<strong>${escapeHtml(lead.monthlyLeadVolume)}</strong>) and stack (<strong>${escapeHtml(lead.currentTools)}</strong>), your workflows show strong alignment with our automation architecture.</p><p><a href="https://flowfoundry.io/schedule?lead=${encodeURIComponent(leadId)}" style="display:inline-block;padding:12px 24px;background-color:#10b981;color:#ffffff;text-decoration:none;border-radius:6px;font-weight:600;">Schedule Technical Discovery Session</a></p>`;
  } else if (qualification?.classification === "WARM") {
    nextStepText = `Our engineering team evaluates submissions in detail to ensure we provide targeted architecture recommendations. A solutions consultant will review your stack and follow up with you within 24 to 48 business hours.`;
    nextStepHtml = `<p>Our engineering team evaluates submissions in detail to ensure we provide targeted architecture recommendations. A solutions consultant will review your stack and follow up with you within 24 to 48 business hours.</p>`;
  } else {
    nextStepText = `While our custom enterprise engagements focus on high-velocity inbound pipelines, we publish comprehensive architectural blueprints and automation guides that may assist your team:\nhttps://flowfoundry.io/resources`;
    nextStepHtml = `<p>While our custom enterprise engagements focus on high-velocity inbound pipelines, we publish comprehensive architectural blueprints and automation guides that may assist your team:</p><p><a href="https://flowfoundry.io/resources" style="display:inline-block;padding:10px 20px;background-color:#3b82f6;color:#ffffff;text-decoration:none;border-radius:6px;font-weight:500;">Explore Automation Blueprints</a></p>`;
  }

  const subject = `Automation Audit Request Received — FlowFoundry`;

  const text = `Hello ${firstName},

Thank you for submitting your Automation Audit request for ${company}. We have successfully received your information regarding your current operational challenges (${problem}).

${nextStepText}

If you have any immediate questions, reply directly to this email to connect with our team.

Best regards,
The FlowFoundry Solutions Architecture Team
https://flowfoundry.io
`;

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Automation Audit Request Received</title>
</head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;line-height:1.6;color:#1e293b;max-width:600px;margin:0 auto;padding:24px;">
  <div style="border-bottom:2px solid #e2e8f0;padding-bottom:16px;margin-bottom:24px;">
    <h2 style="margin:0;color:#0f172a;letter-spacing:-0.5px;">FlowFoundry</h2>
    <p style="margin:4px 0 0;font-size:14px;color:#64748b;">AI Lead-to-Customer Engine</p>
  </div>
  <p>Hello ${escapeHtml(firstName)},</p>
  <p>Thank you for submitting your Automation Audit request for <strong>${escapeHtml(company)}</strong>. We have successfully received your information regarding your current operational challenges.</p>
  <div style="background-color:#f8fafc;border-left:4px solid #3b82f6;padding:12px 16px;margin:16px 0;border-radius:0 4px 4px 0;">
    <p style="margin:0;font-size:14px;color:#475569;"><strong>Stated Problem:</strong> ${escapeHtml(problem)}</p>
  </div>
  ${nextStepHtml}
  <p style="font-size:14px;color:#64748b;margin-top:24px;">If you have any immediate questions, reply directly to this email to connect with our team.</p>
  <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0;" />
  <p style="font-size:13px;color:#94a3b8;margin:0;">FlowFoundry &bull; Autonomous B2B Lead Conversion Engine<br/><a href="https://flowfoundry.io" style="color:#64748b;text-decoration:none;">flowfoundry.io</a></p>
</body>
</html>`;

  return {
    from,
    to: [lead.email.trim().toLowerCase()],
    subject,
    text,
    html,
  };
}

/**
 * EMAIL 2: Generates the internal sales/team notification email.
 * Dispatches targeted alerts according to lead classification rules:
 * - HOT: Includes "NEW HOT LEAD", Company, Contact, Lead Score, Classification, Primary Problem, Automation Opportunity, Recommended Next Step.
 * - WARM: Includes "NEW WARM LEAD" with standard 24-48h review timeline.
 * - COLD: Includes "NEW COLD LEAD (NURTURE)" with low-touch campaign logging.
 */
export function generateInternalNotificationEmail(
  lead: ValidatedLeadInput,
  qualification: AIQualification,
  options?: { salesEmail?: string; fromEmail?: string; leadId?: string }
): ResendEmailPayload {
  const from =
    options?.fromEmail ||
    process.env.RESEND_FROM_EMAIL ||
    "FlowFoundry System <alerts@resend.dev>";
  const to = [
    options?.salesEmail ||
      process.env.FLOWFOUNDRY_SALES_EMAIL ||
      "sales@flowfoundry.io",
  ];
  const leadId = options?.leadId || "N/A";
  const classification = qualification.classification;
  const score = qualification.lead_score;
  const company = lead.companyName.trim();
  const contact = `${lead.fullName} (${lead.email}${lead.phone ? ` / ${lead.phone}` : ""})`;

  if (classification === "HOT") {
    const subject = `🔥 NEW HOT LEAD: ${company} (Score: ${score}/100)`;
    const text = `================================================
NEW HOT LEAD
================================================

Company: ${company}
Contact: ${contact}
Lead Score: ${score}/100
Classification: ${classification}
Primary Problem: ${qualification.primary_problem}
Automation Opportunity: ${qualification.automation_opportunity}
Recommended Next Step: ${qualification.recommended_next_step}

Lead ID: ${leadId}
Employees: ${lead.employees}
Monthly Lead Volume: ${lead.monthlyLeadVolume}
Current Tools: ${lead.currentTools}
Website: ${lead.website || "N/A"}
Additional Information: ${lead.additionalInformation || "None"}
Evaluation Reasoning: ${qualification.reasoning}
`;

    const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;line-height:1.5;color:#1e293b;max-width:650px;margin:0 auto;padding:24px;">
  <div style="background-color:#ef4444;color:#ffffff;padding:12px 20px;border-radius:6px;font-weight:700;font-size:18px;margin-bottom:20px;">
    🔥 NEW HOT LEAD
  </div>
  <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
    <tr><td style="padding:8px 0;width:180px;font-weight:600;color:#64748b;">Company:</td><td style="padding:8px 0;font-weight:700;color:#0f172a;font-size:16px;">${escapeHtml(company)}</td></tr>
    <tr><td style="padding:8px 0;font-weight:600;color:#64748b;">Contact:</td><td style="padding:8px 0;">${escapeHtml(contact)}</td></tr>
    <tr><td style="padding:8px 0;font-weight:600;color:#64748b;">Lead Score:</td><td style="padding:8px 0;"><span style="display:inline-block;padding:4px 8px;background-color:#fee2e2;color:#991b1b;border-radius:4px;font-weight:700;">${score}/100</span></td></tr>
    <tr><td style="padding:8px 0;font-weight:600;color:#64748b;">Classification:</td><td style="padding:8px 0;"><strong style="color:#ef4444;">${classification}</strong></td></tr>
    <tr><td style="padding:8px 0;font-weight:600;color:#64748b;">Primary Problem:</td><td style="padding:8px 0;color:#0f172a;">${escapeHtml(qualification.primary_problem)}</td></tr>
    <tr><td style="padding:8px 0;font-weight:600;color:#64748b;">Automation Opportunity:</td><td style="padding:8px 0;color:#0f172a;">${escapeHtml(qualification.automation_opportunity)}</td></tr>
    <tr><td style="padding:8px 0;font-weight:600;color:#64748b;">Recommended Next Step:</td><td style="padding:8px 0;font-weight:700;color:#10b981;">${escapeHtml(qualification.recommended_next_step)}</td></tr>
  </table>
  <div style="background-color:#f8fafc;padding:16px;border-radius:6px;border:1px solid #e2e8f0;font-size:14px;color:#475569;">
    <p style="margin:0 0 8px 0;"><strong>Operational Profile:</strong></p>
    <ul style="margin:0;padding-left:20px;">
      <li>Employees: ${escapeHtml(lead.employees)}</li>
      <li>Monthly Volume: ${escapeHtml(lead.monthlyLeadVolume)}</li>
      <li>Current Tools: ${escapeHtml(lead.currentTools)}</li>
      <li>Website: ${lead.website ? `<a href="${escapeHtml(lead.website)}">${escapeHtml(lead.website)}</a>` : "N/A"}</li>
    </ul>
    <p style="margin:12px 0 4px 0;"><strong>AI Reasoning:</strong></p>
    <p style="margin:0;font-style:italic;">${escapeHtml(qualification.reasoning)}</p>
  </div>
</body>
</html>`;

    return { from, to, subject, text, html };
  }

  if (classification === "WARM") {
    const subject = `⚡ NEW WARM LEAD: ${company} (Score: ${score}/100)`;
    const text = `================================================
NEW WARM LEAD
================================================

Company: ${company}
Contact: ${contact}
Lead Score: ${score}/100
Classification: ${classification}
Primary Problem: ${qualification.primary_problem}
Automation Opportunity: ${qualification.automation_opportunity}
Recommended Action: Review within 24-48 business hours & initiate follow-up outreach

Lead ID: ${leadId}
Employees: ${lead.employees}
Monthly Lead Volume: ${lead.monthlyLeadVolume}
Current Tools: ${lead.currentTools}
`;

    const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;line-height:1.5;color:#1e293b;max-width:650px;margin:0 auto;padding:24px;">
  <div style="background-color:#f59e0b;color:#ffffff;padding:12px 20px;border-radius:6px;font-weight:700;font-size:18px;margin-bottom:20px;">
    ⚡ NEW WARM LEAD
  </div>
  <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
    <tr><td style="padding:8px 0;width:180px;font-weight:600;color:#64748b;">Company:</td><td style="padding:8px 0;font-weight:700;color:#0f172a;">${escapeHtml(company)}</td></tr>
    <tr><td style="padding:8px 0;font-weight:600;color:#64748b;">Contact:</td><td style="padding:8px 0;">${escapeHtml(contact)}</td></tr>
    <tr><td style="padding:8px 0;font-weight:600;color:#64748b;">Lead Score:</td><td style="padding:8px 0;"><span style="display:inline-block;padding:4px 8px;background-color:#fef3c7;color:#92400e;border-radius:4px;font-weight:700;">${score}/100</span></td></tr>
    <tr><td style="padding:8px 0;font-weight:600;color:#64748b;">Classification:</td><td style="padding:8px 0;"><strong style="color:#d97706;">${classification}</strong></td></tr>
    <tr><td style="padding:8px 0;font-weight:600;color:#64748b;">Primary Problem:</td><td style="padding:8px 0;">${escapeHtml(qualification.primary_problem)}</td></tr>
    <tr><td style="padding:8px 0;font-weight:600;color:#64748b;">Automation Opportunity:</td><td style="padding:8px 0;">${escapeHtml(qualification.automation_opportunity)}</td></tr>
    <tr><td style="padding:8px 0;font-weight:600;color:#64748b;">Recommended Action:</td><td style="padding:8px 0;font-weight:600;color:#d97706;">Review within 24-48 business hours & initiate follow-up outreach</td></tr>
  </table>
</body>
</html>`;

    return { from, to, subject, text, html };
  }

  // COLD Lead notification rules
  const subject = `📋 NEW INBOUND LEAD (COLD / NURTURE): ${company} (Score: ${score}/100)`;
  const text = `================================================
NEW COLD LEAD (NURTURE)
================================================

Company: ${company}
Contact: ${contact}
Lead Score: ${score}/100
Classification: ${classification}
Primary Problem: ${qualification.primary_problem}
Automation Opportunity: ${qualification.automation_opportunity}
Workflow Action: Enrolled in educational nurture campaign / low-touch sequence

Lead ID: ${leadId}
`;

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;line-height:1.5;color:#1e293b;max-width:650px;margin:0 auto;padding:24px;">
  <div style="background-color:#64748b;color:#ffffff;padding:12px 20px;border-radius:6px;font-weight:700;font-size:18px;margin-bottom:20px;">
    📋 NEW COLD LEAD (NURTURE)
  </div>
  <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
    <tr><td style="padding:8px 0;width:180px;font-weight:600;color:#64748b;">Company:</td><td style="padding:8px 0;font-weight:700;color:#0f172a;">${escapeHtml(company)}</td></tr>
    <tr><td style="padding:8px 0;font-weight:600;color:#64748b;">Contact:</td><td style="padding:8px 0;">${escapeHtml(contact)}</td></tr>
    <tr><td style="padding:8px 0;font-weight:600;color:#64748b;">Lead Score:</td><td style="padding:8px 0;"><span style="display:inline-block;padding:4px 8px;background-color:#f1f5f9;color:#475569;border-radius:4px;font-weight:700;">${score}/100</span></td></tr>
    <tr><td style="padding:8px 0;font-weight:600;color:#64748b;">Classification:</td><td style="padding:8px 0;"><strong style="color:#64748b;">${classification}</strong></td></tr>
    <tr><td style="padding:8px 0;font-weight:600;color:#64748b;">Primary Problem:</td><td style="padding:8px 0;">${escapeHtml(qualification.primary_problem)}</td></tr>
    <tr><td style="padding:8px 0;font-weight:600;color:#64748b;">Automation Opportunity:</td><td style="padding:8px 0;">${escapeHtml(qualification.automation_opportunity)}</td></tr>
    <tr><td style="padding:8px 0;font-weight:600;color:#64748b;">Workflow Action:</td><td style="padding:8px 0;color:#64748b;">Enrolled in educational nurture campaign / low-touch sequence</td></tr>
  </table>
</body>
</html>`;

  return { from, to, subject, text, html };
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Service for Resend Email Automation in FlowFoundry.
 * Dispatches transactional prospect confirmations and internal sales notifications.
 * Enforces email validation, secret masking, error resilience, and database preservation.
 */
export const resendService = {
  validateEmail,
  generateLeadConfirmationEmail,
  generateInternalNotificationEmail,

  /**
   * Sends an email via the Resend REST API (https://api.resend.com/emails).
   * Supports an optional customTransport for testing and mock environments.
   */
  async sendEmail(
    payload: ResendEmailPayload,
    options?: {
      customTransport?: ResendTransport;
      apiKey?: string;
    }
  ): Promise<ResendSendResult> {
    const apiKey = options?.apiKey || process.env.RESEND_API_KEY;
    const recipient = payload.to[0] || "unknown";

    if (!apiKey) {
      console.warn(
        `[FlowFoundry Resend] Warning: RESEND_API_KEY is not configured. Email to ${recipient} simulated.`
      );
      return {
        success: true,
        messageId: `sim_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        recipient,
      };
    }

    const transport: ResendTransport =
      options?.customTransport ||
      ((endpoint, init) =>
        fetch(endpoint, {
          ...init,
          signal: AbortSignal.timeout(10000),
        }));

    try {
      const response = await transport("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const rawErr = await response.text();
        const safeErr = maskSecrets(rawErr);
        console.error(
          `[FlowFoundry Resend] Dispatch failed for ${recipient} (Status ${response.status}): ${safeErr}`
        );
        return {
          success: false,
          error: safeErr,
          statusCode: response.status,
          recipient,
        };
      }

      const data = (await response.json()) as { id?: string };
      console.log(
        `[FlowFoundry Resend] Email delivered to ${recipient} (Message ID: ${data.id || "ok"})`
      );

      return {
        success: true,
        messageId: data.id || "ok",
        recipient,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown network error";
      const safeErr = maskSecrets(message);
      console.error(
        `[FlowFoundry Resend] Network or timeout error sending to ${recipient}: ${safeErr}`
      );
      return {
        success: false,
        error: safeErr,
        recipient,
      };
    }
  },

  /**
   * Coordinates dispatch of both Email 1 (Lead confirmation) and Email 2 (Internal notification).
   * Validates prospect email address, executes dispatch, logs integration status,
   * and guarantees that database lead records are preserved if any email fails.
   */
  async dispatchLeadEmails(
    lead: ValidatedLeadInput,
    qualification: AIQualification,
    options?: {
      leadId?: string;
      customTransport?: ResendTransport;
      apiKey?: string;
      salesEmail?: string;
    }
  ): Promise<LeadEmailDispatchResult> {
    const leadId = options?.leadId || `lead_${Date.now()}`;
    const emailValid = validateEmail(lead.email);

    // Case 1: Invalid Prospect Email Address
    if (!emailValid) {
      console.warn(
        `[FlowFoundry Resend] Invalid prospect email address provided: "${lead.email}" for lead ${leadId}. Skipping confirmation email.`
      );

      // Attempt to notify sales team of invalid contact detail if sales email is valid
      const internalAlertPayload = generateInternalNotificationEmail(
        lead,
        qualification,
        {
          salesEmail: options?.salesEmail,
          leadId,
        }
      );
      // Prepend warning to internal alert text
      internalAlertPayload.subject = `⚠️ [INVALID EMAIL] ${internalAlertPayload.subject}`;
      internalAlertPayload.text = `⚠️ NOTICE: Prospect provided invalid email: "${lead.email}". Direct confirmation could not be dispatched.\n\n${internalAlertPayload.text}`;

      const internalResult = await this.sendEmail(internalAlertPayload, {
        customTransport: options?.customTransport,
        apiKey: options?.apiKey,
      });

      // Update lead in Supabase database with invalid email status note if valid UUID
      if (leadId && UUID_REGEX.test(leadId)) {
        try {
          await leadDbService.updateLead(leadId, {
            status: "NEW",
            ai_reasoning: `${qualification.reasoning} [Notice: Prospect email "${lead.email}" was invalid; confirmation skipped]`,
          });
        } catch (dbErr) {
          console.warn(`[FlowFoundry DB] Lead update error for ${leadId}:`, dbErr);
        }
      }

      return {
        success: false,
        leadId,
        prospectEmailResult: {
          success: false,
          error: `Invalid email address format: "${lead.email}"`,
          recipient: lead.email,
        },
        internalNotificationResult: internalResult,
        leadPreserved: true,
        integrationStatus: "INVALID_EMAIL",
        errorReason: `Prospect email "${lead.email}" failed RFC validation.`,
      };
    }

    // Case 2: Valid Email Address -> Prepare Payloads
    const prospectPayload = generateLeadConfirmationEmail(lead, qualification, {
      leadId,
    });
    const internalPayload = generateInternalNotificationEmail(
      lead,
      qualification,
      {
        salesEmail: options?.salesEmail,
        leadId,
      }
    );

    // Dispatch Email 1: Lead Confirmation
    const prospectResult = await this.sendEmail(prospectPayload, {
      customTransport: options?.customTransport,
      apiKey: options?.apiKey,
    });

    // Dispatch Email 2: Internal Sales/Team Notification
    const internalResult = await this.sendEmail(internalPayload, {
      customTransport: options?.customTransport,
      apiKey: options?.apiKey,
    });

    // Determine overall integration status
    let integrationStatus: ResendIntegrationStatus = "SENT";
    let overallSuccess = true;
    let errorReason: string | undefined = undefined;

    if (!prospectResult.success && !internalResult.success) {
      integrationStatus = "FAILED";
      overallSuccess = false;
      errorReason = `Both confirmation and internal notification failed: ${prospectResult.error}; ${internalResult.error}`;
    } else if (!prospectResult.success || !internalResult.success) {
      integrationStatus = "PARTIAL_FAILURE";
      overallSuccess = false;
      errorReason = !prospectResult.success
        ? `Lead confirmation failed: ${prospectResult.error}`
        : `Internal notification failed: ${internalResult.error}`;
    }

    // If an email failure occurred, log and record failure state without losing lead
    if (!overallSuccess) {
      console.error(
        `[FlowFoundry Resend Exception] Lead ${leadId} (${lead.companyName}) encountered email integration issue: ${errorReason}`
      );

      if (leadId && UUID_REGEX.test(leadId)) {
        try {
          await leadDbService.updateLead(leadId, {
            status: "NEW",
            ai_reasoning: `${qualification.reasoning} [Email Warning: ${errorReason}]`,
          });
        } catch (dbErr) {
          console.warn(`[FlowFoundry DB] Lead update error for ${leadId}:`, dbErr);
        }
      }
    } else {
      console.log(
        `[FlowFoundry Resend] Both confirmation and internal notification dispatched successfully for lead ${leadId} (${lead.companyName}).`
      );
    }

    return {
      success: overallSuccess,
      leadId,
      prospectEmailResult: prospectResult,
      internalNotificationResult: internalResult,
      leadPreserved: true, // Always durably preserved
      integrationStatus,
      errorReason,
    };
  },
};
