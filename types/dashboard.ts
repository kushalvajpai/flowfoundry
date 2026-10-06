import type { LeadClassification, LeadStatus, LeadDbRow } from "./lead";

export interface DashboardMetrics {
  totalLeads: number;
  hotLeads: number;
  warmLeads: number;
  coldLeads: number;
  unclassifiedLeads: number;
  averageLeadScore: number;
  newLeads: number;
  contactedLeads: number;
  qualifiedLeads: number;
  meetingsBooked: number;
  wonLeads: number;
  lostLeads: number;
  // Useful lead analytics metrics
  leadsPerDay: number;
  leadsPerWeek: number;
  leadsPerMonth: number;
  hotPercentage: number;
  warmPercentage: number;
  coldPercentage: number;
  conversionToContacted: number;
  conversionToMeeting: number;
  conversionToWon: number;
  // Ingestion counts across standard windows
  leadsPast24h?: number;
  leadsPast7d?: number;
  leadsPast30d?: number;
}

export interface LeadsOverTimePoint {
  date: string;
  label: string;
  total: number;
  hot: number;
  warm: number;
  cold: number;
}

export interface DistributionItem {
  name: string;
  count: number;
  percentage: number;
  color?: string;
}

export interface FunnelStage {
  id: string;
  name: string;
  count: number;
  percentage: number; // Conversion from total inbound
  conversionFromPrevious: number; // Conversion rate from prior step
  dropoffCount: number;
  color: string;
}

export interface DashboardChartsData {
  leadsOverTime: LeadsOverTimePoint[];
  leadsByClassification: DistributionItem[];
  leadsByIndustry: DistributionItem[];
  leadStatusFunnel: FunnelStage[];
  leadStatusDistribution: DistributionItem[];
}

export interface DashboardFilterParams {
  search?: string;
  classification?: LeadClassification | "ALL" | "UNCLASSIFIED";
  industry?: string;
  status?: LeadStatus | "ALL";
  dateRange?: "all" | "today" | "7d" | "30d" | "90d";
  page?: number;
  pageSize?: number;
  sortBy?: "created_at" | "lead_score" | "company_name";
  sortOrder?: "asc" | "desc";
}

export interface DashboardResponse {
  success: boolean;
  metrics: DashboardMetrics;
  charts: DashboardChartsData;
  leads: LeadDbRow[];
  totalFilteredCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  availableIndustries: string[];
  error?: string;
}
