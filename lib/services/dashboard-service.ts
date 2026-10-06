import { getSupabaseServerClient } from "../db/supabase";
import type {
  DashboardMetrics,
  DashboardChartsData,
  DashboardFilterParams,
  DashboardResponse,
  LeadsOverTimePoint,
  DistributionItem,
  FunnelStage,
} from "../../types/dashboard";
import type { LeadDbRow, LeadClassification, LeadStatus } from "../../types/lead";

/**
 * Service for querying and aggregating real database metrics, charts, and filtered tables
 * for the FlowFoundry internal dashboard.
 * Enforces optimized database reads, zero fake data, and resilient error recovery.
 */
const ALLOWED_SORT_COLUMNS = ["created_at", "lead_score", "company_name"] as const;
type AllowedSortColumn = (typeof ALLOWED_SORT_COLUMNS)[number];

/**
 * Sanitizes sorting column against an immutable allowlist to prevent SQL/PostgREST injection.
 */
function sanitizeSortColumn(val: unknown): AllowedSortColumn {
  if (typeof val === "string" && ALLOWED_SORT_COLUMNS.includes(val as AllowedSortColumn)) {
    return val as AllowedSortColumn;
  }
  return "created_at";
}

/**
 * Sanitizes search input to prevent PostgREST syntax, SQL injection tokens,
 * and WAF-triggering payloads in .or() clauses.
 * Strips SQL comments (--), operator syntax, and restricts to safe search characters
 * (letters, digits, spaces, dots, hyphens, underscores, and @).
 */
function sanitizeSearchQuery(val: unknown): string {
  if (typeof val !== "string") return "";
  return val
    .replace(/--+/g, " ")
    .replace(/[^a-zA-Z0-9\s.@_-]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 64);
}

export const dashboardService = {
  /**
   * Retrieves aggregated metrics, chart trends, and filtered lead records from Supabase.
   */
  async getDashboardData(params: DashboardFilterParams = {}): Promise<DashboardResponse> {
    const supabase = getSupabaseServerClient();
    const page = Math.max(1, params.page || 1);
    const pageSize = Math.min(100, Math.max(1, params.pageSize || 25));
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    try {
      // 1. Fetch all lightweight metadata records to compute global metrics & charts efficiently
      // We only select the minimal required columns for aggregation to optimize query performance
      const { data: allLeadsRaw, error: aggError } = await supabase
        .from("leads")
        .select("id, created_at, classification, status, lead_score, industry")
        .order("created_at", { ascending: false });

      if (aggError) {
        console.error("[FlowFoundry Dashboard] Error loading aggregate leads:", aggError.message);
        throw new Error(aggError.message);
      }

      const allRows = (allLeadsRaw || []) as Array<{
        id: string;
        created_at: string;
        classification: LeadClassification | null;
        status: LeadStatus;
        lead_score: number | null;
        industry: string;
      }>;

      // 2. Compute Real Global Metrics
      const totalLeads = allRows.length;
      let hotLeads = 0;
      let warmLeads = 0;
      let coldLeads = 0;
      let unclassifiedLeads = 0;
      let totalScoreSum = 0;
      let scoredLeadCount = 0;

      let newLeads = 0;
      let contactedLeads = 0;
      let qualifiedLeads = 0;
      let meetingsBooked = 0;
      let wonLeads = 0;
      let lostLeads = 0;

      const industrySet = new Set<string>();

      for (const row of allRows) {
        // Industry collection
        if (row.industry) {
          industrySet.add(row.industry.trim());
        }

        // Classification counts
        if (row.classification === "HOT") hotLeads++;
        else if (row.classification === "WARM") warmLeads++;
        else if (row.classification === "COLD") coldLeads++;
        else unclassifiedLeads++;

        // Lead score calculation
        if (typeof row.lead_score === "number" && !isNaN(row.lead_score)) {
          totalScoreSum += row.lead_score;
          scoredLeadCount++;
        }

        // Status counts
        if (row.status === "NEW") newLeads++;
        else if (row.status === "CONTACTED") contactedLeads++;
        else if (row.status === "QUALIFIED") qualifiedLeads++;
        else if (row.status === "MEETING_BOOKED") meetingsBooked++;
        else if (row.status === "WON") wonLeads++;
        else if (row.status === "LOST") lostLeads++;
      }

      const averageLeadScore =
        scoredLeadCount > 0
          ? Math.round((totalScoreSum / scoredLeadCount) * 10) / 10
          : 0;

      // 2A. Time-based Velocity Metrics
      const now = Date.now();
      const oneDayMs = 24 * 60 * 60 * 1000;
      const oneWeekMs = 7 * oneDayMs;
      const oneMonthMs = 30 * oneDayMs;

      let leadsPast24h = 0;
      let leadsPast7d = 0;
      let leadsPast30d = 0;
      let oldestTimestamp = now;

      for (const row of allRows) {
        if (row.created_at) {
          const t = new Date(row.created_at).getTime();
          if (!isNaN(t)) {
            if (t < oldestTimestamp) oldestTimestamp = t;
            const ageMs = now - t;
            if (ageMs <= oneDayMs) leadsPast24h++;
            if (ageMs <= oneWeekMs) leadsPast7d++;
            if (ageMs <= oneMonthMs) leadsPast30d++;
          }
        }
      }

      // Span in days between oldest lead and now (minimum 1 day)
      const activeDaysSpan = allRows.length > 0
        ? Math.max(1, Math.ceil((now - oldestTimestamp) / oneDayMs))
        : 1;

      // Velocity rates
      const leadsPerDay = totalLeads > 0
        ? Math.round((totalLeads / activeDaysSpan) * 10) / 10
        : 0;

      const leadsPerWeek = totalLeads > 0
        ? (activeDaysSpan <= 7 ? leadsPast7d : Math.round(leadsPerDay * 7 * 10) / 10)
        : 0;

      const leadsPerMonth = totalLeads > 0
        ? (activeDaysSpan <= 30 ? leadsPast30d : Math.round(leadsPerDay * 30 * 10) / 10)
        : 0;

      // 2B. Quality & Classification Percentages
      const hotPercentage = totalLeads > 0
        ? Math.round((hotLeads / totalLeads) * 1000) / 10
        : 0;
      const warmPercentage = totalLeads > 0
        ? Math.round((warmLeads / totalLeads) * 1000) / 10
        : 0;
      const coldPercentage = totalLeads > 0
        ? Math.round((coldLeads / totalLeads) * 1000) / 10
        : 0;

      // 2C. Funnel Cumulative Conversions
      const contactedCumulative = contactedLeads + qualifiedLeads + meetingsBooked + wonLeads;
      const qualifiedCumulative = qualifiedLeads + meetingsBooked + wonLeads;
      const meetingCumulative = meetingsBooked + wonLeads;
      const wonCumulative = wonLeads;

      const conversionToContacted = totalLeads > 0
        ? Math.round((contactedCumulative / totalLeads) * 1000) / 10
        : 0;

      const conversionToMeeting = totalLeads > 0
        ? Math.round((meetingCumulative / totalLeads) * 1000) / 10
        : 0;

      const conversionToWon = totalLeads > 0
        ? Math.round((wonCumulative / totalLeads) * 1000) / 10
        : 0;

      const metrics: DashboardMetrics = {
        totalLeads,
        hotLeads,
        warmLeads,
        coldLeads,
        unclassifiedLeads,
        averageLeadScore,
        newLeads,
        contactedLeads,
        qualifiedLeads,
        meetingsBooked,
        wonLeads,
        lostLeads,
        leadsPerDay,
        leadsPerWeek,
        leadsPerMonth,
        hotPercentage,
        warmPercentage,
        coldPercentage,
        conversionToContacted,
        conversionToMeeting,
        conversionToWon,
        leadsPast24h,
        leadsPast7d,
        leadsPast30d,
      };

      // 3. Compute Real Charts Data
      // 3A. Leads Over Time (grouped chronologically by day)
      const dateMap = new Map<string, { total: number; hot: number; warm: number; cold: number }>();

      // Default last 14 days or actual lead dates
      for (const row of allRows) {
        if (!row.created_at) continue;
        const dateKey = row.created_at.slice(0, 10); // YYYY-MM-DD
        const current = dateMap.get(dateKey) || { total: 0, hot: 0, warm: 0, cold: 0 };
        current.total++;
        if (row.classification === "HOT") current.hot++;
        else if (row.classification === "WARM") current.warm++;
        else if (row.classification === "COLD") current.cold++;
        dateMap.set(dateKey, current);
      }

      // Sort dates chronologically
      const sortedDates = Array.from(dateMap.keys()).sort();
      const leadsOverTime: LeadsOverTimePoint[] = sortedDates.map((dateKey) => {
        const item = dateMap.get(dateKey)!;
        const parsedDate = new Date(dateKey + "T00:00:00Z");
        const label = parsedDate.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          timeZone: "UTC",
        });
        return {
          date: dateKey,
          label,
          total: item.total,
          hot: item.hot,
          warm: item.warm,
          cold: item.cold,
        };
      });

      // 3B. Leads by Classification
      const leadsByClassification: DistributionItem[] = [
        {
          name: "HOT",
          count: hotLeads,
          percentage: totalLeads > 0 ? Math.round((hotLeads / totalLeads) * 100) : 0,
          color: "#ef4444",
        },
        {
          name: "WARM",
          count: warmLeads,
          percentage: totalLeads > 0 ? Math.round((warmLeads / totalLeads) * 100) : 0,
          color: "#f59e0b",
        },
        {
          name: "COLD",
          count: coldLeads,
          percentage: totalLeads > 0 ? Math.round((coldLeads / totalLeads) * 100) : 0,
          color: "#3b82f6",
        },
      ];
      if (unclassifiedLeads > 0) {
        leadsByClassification.push({
          name: "Pending",
          count: unclassifiedLeads,
          percentage: totalLeads > 0 ? Math.round((unclassifiedLeads / totalLeads) * 100) : 0,
          color: "#64748b",
        });
      }

      // 3C. Leads by Industry
      const industryCounts = new Map<string, number>();
      for (const row of allRows) {
        const ind = row.industry ? row.industry.trim() : "Unspecified";
        industryCounts.set(ind, (industryCounts.get(ind) || 0) + 1);
      }

      const industryColors = ["#3b82f6", "#10b981", "#8b5cf6", "#f59e0b", "#ec4899", "#06b6d4"];
      const leadsByIndustry: DistributionItem[] = Array.from(industryCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6)
        .map(([name, count], index) => ({
          name,
          count,
          percentage: totalLeads > 0 ? Math.round((count / totalLeads) * 100) : 0,
          color: industryColors[index % industryColors.length],
        }));

      // 3D. Lead Status Distribution
      const statusColors: Record<LeadStatus, string> = {
        NEW: "#3b82f6",
        CONTACTED: "#8b5cf6",
        QUALIFIED: "#10b981",
        MEETING_BOOKED: "#06b6d4",
        WON: "#22c55e",
        LOST: "#64748b",
      };

      const statusCounts: Record<LeadStatus, number> = {
        NEW: newLeads,
        CONTACTED: contactedLeads,
        QUALIFIED: qualifiedLeads,
        MEETING_BOOKED: meetingsBooked,
        WON: wonLeads,
        LOST: lostLeads,
      };

      const leadStatusDistribution: DistributionItem[] = (
        Object.keys(statusCounts) as LeadStatus[]
      ).map((st) => ({
        name: st.replace("_", " "),
        count: statusCounts[st],
        percentage: totalLeads > 0 ? Math.round((statusCounts[st] / totalLeads) * 100) : 0,
        color: statusColors[st],
      }));

      // 3E. Lead Status Conversion Funnel
      const leadStatusFunnel: FunnelStage[] = [
        {
          id: "ingested",
          name: "Inbound Ingested",
          count: totalLeads,
          percentage: totalLeads > 0 ? 100 : 0,
          conversionFromPrevious: 100,
          dropoffCount: totalLeads - contactedCumulative,
          color: "#3b82f6",
        },
        {
          id: "contacted",
          name: "Contacted Leads",
          count: contactedCumulative,
          percentage: totalLeads > 0 ? Math.round((contactedCumulative / totalLeads) * 1000) / 10 : 0,
          conversionFromPrevious: totalLeads > 0 ? Math.round((contactedCumulative / totalLeads) * 1000) / 10 : 0,
          dropoffCount: contactedCumulative - qualifiedCumulative,
          color: "#8b5cf6",
        },
        {
          id: "qualified",
          name: "Qualified ICP",
          count: qualifiedCumulative,
          percentage: totalLeads > 0 ? Math.round((qualifiedCumulative / totalLeads) * 1000) / 10 : 0,
          conversionFromPrevious: contactedCumulative > 0 ? Math.round((qualifiedCumulative / contactedCumulative) * 1000) / 10 : 0,
          dropoffCount: qualifiedCumulative - meetingCumulative,
          color: "#10b981",
        },
        {
          id: "meeting",
          name: "Meeting Booked",
          count: meetingCumulative,
          percentage: totalLeads > 0 ? Math.round((meetingCumulative / totalLeads) * 1000) / 10 : 0,
          conversionFromPrevious: qualifiedCumulative > 0 ? Math.round((meetingCumulative / qualifiedCumulative) * 1000) / 10 : 0,
          dropoffCount: meetingCumulative - wonCumulative,
          color: "#06b6d4",
        },
        {
          id: "won",
          name: "Won Customers",
          count: wonCumulative,
          percentage: totalLeads > 0 ? Math.round((wonCumulative / totalLeads) * 1000) / 10 : 0,
          conversionFromPrevious: meetingCumulative > 0 ? Math.round((wonCumulative / meetingCumulative) * 1000) / 10 : 0,
          dropoffCount: 0,
          color: "#22c55e",
        },
      ];

      const charts: DashboardChartsData = {
        leadsOverTime,
        leadsByClassification,
        leadsByIndustry,
        leadStatusFunnel,
        leadStatusDistribution,
      };

      // 4. Build Filtered & Paginated Leads Table Query
      let query = supabase
        .from("leads")
        .select(
          "id, full_name, company_name, email, phone, website, industry, employees, monthly_lead_volume, biggest_problem, current_tools, additional_information, lead_score, classification, business_type, primary_problem, automation_opportunity, estimated_priority, recommended_next_step, ai_reasoning, status, source, created_at, updated_at",
          { count: "exact" }
        );

      // Search Filter: full_name, company_name, email (sanitized against PostgREST injection)
      if (params.search) {
        const cleanSearch = sanitizeSearchQuery(params.search);
        if (cleanSearch.length > 0) {
          query = query.or(
            `full_name.ilike.%${cleanSearch}%,company_name.ilike.%${cleanSearch}%,email.ilike.%${cleanSearch}%`
          );
        }
      }

      // Classification Filter
      if (params.classification && params.classification !== "ALL") {
        if (params.classification === "UNCLASSIFIED") {
          query = query.is("classification", null);
        } else {
          query = query.eq("classification", params.classification);
        }
      }

      // Industry Filter
      if (params.industry && params.industry !== "ALL") {
        query = query.eq("industry", params.industry.trim().slice(0, 100));
      }

      // Status Filter
      if (params.status && params.status !== "ALL") {
        query = query.eq("status", params.status);
      }

      // Date Range Filter
      if (params.dateRange && params.dateRange !== "all") {
        const now = new Date();
        let cutoff: Date | null = null;

        if (params.dateRange === "today") {
          cutoff = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        } else if (params.dateRange === "7d") {
          cutoff = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        } else if (params.dateRange === "30d") {
          cutoff = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        } else if (params.dateRange === "90d") {
          cutoff = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        }

        if (cutoff) {
          query = query.gte("created_at", cutoff.toISOString());
        }
      }

      // Order & Pagination with allowlisted sort column
      const sortBy = sanitizeSortColumn(params.sortBy);
      const ascending = params.sortOrder === "asc";
      query = query.order(sortBy, { ascending }).range(from, to);

      const { data: pagedData, count: totalFilteredCount, error: tableError } = await query;

      if (tableError) {
        console.error("[FlowFoundry Dashboard] Error fetching paged leads:", tableError.message);
        throw new Error(tableError.message);
      }

      const totalCount = totalFilteredCount ?? (pagedData ? pagedData.length : 0);
      const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

      return {
        success: true,
        metrics,
        charts,
        leads: (pagedData as LeadDbRow[]) || [],
        totalFilteredCount: totalCount,
        page,
        pageSize,
        totalPages,
        availableIndustries: Array.from(industrySet).sort(),
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown database error";
      console.error("[FlowFoundry Dashboard Service] Exception:", message);
      return {
        success: false,
        metrics: {
          totalLeads: 0,
          hotLeads: 0,
          warmLeads: 0,
          coldLeads: 0,
          unclassifiedLeads: 0,
          averageLeadScore: 0,
          newLeads: 0,
          contactedLeads: 0,
          qualifiedLeads: 0,
          meetingsBooked: 0,
          wonLeads: 0,
          lostLeads: 0,
          leadsPerDay: 0,
          leadsPerWeek: 0,
          leadsPerMonth: 0,
          hotPercentage: 0,
          warmPercentage: 0,
          coldPercentage: 0,
          conversionToContacted: 0,
          conversionToMeeting: 0,
          conversionToWon: 0,
          leadsPast24h: 0,
          leadsPast7d: 0,
          leadsPast30d: 0,
        },
        charts: {
          leadsOverTime: [],
          leadsByClassification: [],
          leadsByIndustry: [],
          leadStatusFunnel: [],
          leadStatusDistribution: [],
        },
        leads: [],
        totalFilteredCount: 0,
        page: 1,
        pageSize,
        totalPages: 1,
        availableIndustries: [],
        error: message,
      };
    }
  },

  /**
   * Updates a lead status directly from the dashboard (e.g. NEW -> CONTACTED -> MEETING_BOOKED).
   */
  async updateLeadStatus(id: string, status: LeadStatus): Promise<{ success: boolean; error?: string }> {
    try {
      const supabase = getSupabaseServerClient();
      const { error } = await supabase
        .from("leads")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", id);

      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : "Failed to update lead status",
      };
    }
  },
};
