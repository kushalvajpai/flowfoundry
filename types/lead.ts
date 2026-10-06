export type LeadStatus =
  | "NEW"
  | "CONTACTED"
  | "QUALIFIED"
  | "MEETING_BOOKED"
  | "WON"
  | "LOST";

export type LeadClassification = "HOT" | "WARM" | "COLD";
export type LeadEstimatedPriority = "HIGH" | "MEDIUM" | "LOW";

export interface LeadDbRow {
  id: string;
  full_name: string;
  company_name: string;
  email: string;
  phone: string | null;
  website: string | null;
  industry: string;
  employees: string;
  monthly_lead_volume: string;
  biggest_problem: string;
  current_tools: string;
  additional_information: string | null;
  lead_score: number | null;
  classification: LeadClassification | null;
  business_type: string | null;
  primary_problem: string | null;
  automation_opportunity: string | null;
  estimated_priority: LeadEstimatedPriority | null;
  recommended_next_step: string | null;
  ai_reasoning: string | null;
  status: LeadStatus;
  source: string;
  created_at: string;
  updated_at: string;
}

export interface CreateLeadDbInput {
  id?: string;
  full_name: string;
  company_name: string;
  email: string;
  phone?: string | null;
  website?: string | null;
  industry: string;
  employees: string;
  monthly_lead_volume: string;
  biggest_problem: string;
  current_tools: string;
  additional_information?: string | null;
  lead_score?: number | null;
  classification?: LeadClassification | null;
  business_type?: string | null;
  primary_problem?: string | null;
  automation_opportunity?: string | null;
  estimated_priority?: LeadEstimatedPriority | null;
  recommended_next_step?: string | null;
  ai_reasoning?: string | null;
  status?: LeadStatus;
  source?: string;
}

export type QualificationTier = "Tier 1 - High Value" | "Tier 2 - Growth" | "Tier 3 - Nurture" | "Unqualified";

export interface LeadQualification {
  score: number;
  tier: QualificationTier;
  confidence: number;
  rationale: string[];
}

export interface LeadRouting {
  destination: "hubspot" | "salesforce" | "webhook" | "internal";
  status: "pending" | "dispatched" | "failed";
  dispatchedAt?: string;
}

export interface LeadSubmissionPayload {
  fullName: string;
  companyName: string;
  email: string;
  phone?: string;
  website?: string;
  industry: string;
  employees: string;
  monthlyLeadVolume: string;
  biggestProblem: string;
  currentTools: string;
  additionalInformation?: string;
}

export interface LeadSubmissionSuccessResponse {
  success: true;
  message: string;
  leadId?: string;
  isDuplicate?: boolean;
}

export interface LeadSubmissionErrorResponse {
  success: false;
  message: "Unable to process your request";
  errors?: Record<string, string>;
  error?: string;
}

export type LeadSubmissionResponse =
  | LeadSubmissionSuccessResponse
  | LeadSubmissionErrorResponse;

export interface Lead extends LeadSubmissionPayload {
  id: string;
  status: LeadStatus;
  qualification?: LeadQualification;
  routing?: LeadRouting;
  createdAt: string;
}

export interface EngineMetric {
  label: string;
  value: string;
  change: string;
  status: "positive" | "neutral" | "attention";
}
