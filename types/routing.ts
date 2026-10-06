import type { ValidatedLeadInput } from "../lib/validations/lead";
import type { AIQualification } from "../lib/validations/ai-qualification";

export type LeadPriority = "HIGH" | "MEDIUM" | "LOW";

export type RoutingWorkflow =
  | "discovery_call"
  | "follow_up"
  | "nurture"
  | "exception_review";

export interface CrmRecord {
  leadId: string;
  contact: {
    fullName: string;
    companyName: string;
    email: string;
    phone?: string;
    website?: string;
    industry: string;
    employees: string;
    monthlyLeadVolume: string;
    currentTools: string;
    biggestProblem: string;
    additionalInformation?: string;
  };
  qualification: {
    score: number;
    classification: "HOT" | "WARM" | "COLD";
    businessType: string;
    primaryProblem: string;
    automationOpportunity: string;
    reasoning: string;
  };
  routing: {
    priority: LeadPriority;
    stage: string;
    workflow: RoutingWorkflow;
    recommendedNextStep: string;
    timestamp: string;
  };
}

export interface InternalSalesNotification {
  targetChannel: "sales_alerts_high_priority";
  urgency: "IMMEDIATE" | "STANDARD";
  leadId: string;
  companyName: string;
  contactName: string;
  email: string;
  leadScore: number;
  classification: "HOT";
  primaryProblem: string;
  automationOpportunity: string;
  reasoning: string;
  recommendedAction: string;
  timestamp: string;
}

export interface ProspectConfirmationEmail {
  recipientEmail: string;
  recipientName: string;
  subject: string;
  templateType:
    | "hot_discovery_invitation"
    | "warm_intake_acknowledgment"
    | "cold_resource_acknowledgment";
  copy: {
    greeting: string;
    acknowledgment: string;
    nextSteps: string;
    callToAction?: {
      label: string;
      url: string;
    };
    signoff: string;
  };
}

export interface RoutingSuccessResult {
  status: "routed";
  leadId: string;
  classification: "HOT" | "WARM" | "COLD";
  priority: LeadPriority;
  crmRecord: CrmRecord;
  aiQualification?: AIQualification;
  internalNotification?: InternalSalesNotification;
  prospectEmail?: ProspectConfirmationEmail;
  nextWorkflow: RoutingWorkflow;
  timestamp: string;
}

export interface RoutingExceptionResult {
  status: "exception";
  leadId: string;
  errorReason: string;
  manualReviewRequired: true;
  originalLeadData: ValidatedLeadInput;
  rawAiOutput: unknown;
  crmRecord: {
    leadId: string;
    priority: "HIGH";
    workflow: "exception_review";
    status: "review_required";
    timestamp: string;
  };
  internalAlert: {
    targetChannel: "engineering_and_operations";
    leadId: string;
    message: string;
    timestamp: string;
  };
  timestamp: string;
}

export type RoutingResult = RoutingSuccessResult | RoutingExceptionResult;

export interface HubSpotContactProperties {
  email: string;
  firstname: string;
  lastname: string;
  phone?: string;
  company: string;
  industry: string;
  website?: string;
  flowfoundry_lead_score: string;
  flowfoundry_classification: "HOT" | "WARM" | "COLD";
  flowfoundry_primary_problem: string;
  flowfoundry_automation_opportunity: string;
  lead_source: string;
  hs_lead_status: string;
}

export interface HubSpotUpsertResult {
  success: boolean;
  contactId?: string;
  action?: "created" | "updated";
  error?: string;
  statusCode?: number;
  properties?: HubSpotContactProperties;
  routedToException?: boolean;
}

export interface ResendEmailPayload {
  from: string;
  to: string[];
  subject: string;
  text: string;
  html: string;
  reply_to?: string;
}

export interface ResendSendResult {
  success: boolean;
  messageId?: string;
  error?: string;
  statusCode?: number;
  recipient?: string;
}

export type ResendIntegrationStatus =
  | "SENT"
  | "PARTIAL_FAILURE"
  | "FAILED"
  | "INVALID_EMAIL";

export interface LeadEmailDispatchResult {
  success: boolean;
  leadId: string;
  prospectEmailResult: ResendSendResult;
  internalNotificationResult: ResendSendResult;
  leadPreserved: boolean;
  integrationStatus: ResendIntegrationStatus;
  errorReason?: string;
}

