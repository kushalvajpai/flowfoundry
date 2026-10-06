import { getSupabaseServerClient } from "../db/supabase";
import type {
  LeadDbRow,
  CreateLeadDbInput,
  LeadStatus,
  LeadClassification,
} from "../../types/lead";
import { maskSecrets, isTransientError } from "../utils/security";

export interface DbServiceResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Executes a database operation with exponential backoff retry for transient network / pool errors.
 */
async function withDbRetry<T>(
  operation: () => Promise<T>,
  options: { maxRetries?: number; delayMs?: number; label?: string } = {}
): Promise<T> {
  const maxRetries = options.maxRetries ?? 2;
  const initialDelay = options.delayMs ?? 200;
  const label = options.label || "DB Operation";

  let lastError: unknown;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (err) {
      lastError = err;
      if (attempt < maxRetries && isTransientError(err)) {
        const delay = initialDelay * Math.pow(2, attempt) + Math.random() * 50;
        console.warn(
          `[FlowFoundry DB] Transient error in ${label} (attempt ${attempt + 1}/${maxRetries + 1}): ${maskSecrets(
            err instanceof Error ? err.message : String(err)
          )}. Retrying in ${Math.round(delay)}ms...`
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
      } else {
        break;
      }
    }
  }
  throw lastError;
}

/**
 * Service layer for durable PostgreSQL persistence via Supabase.
 * Encapsulates database queries, handles connection failures, sanitizes error logs,
 * retries transient database blips, and guarantees raw database errors are never exposed.
 */
export const leadDbService = {
  /**
   * Persists a new lead into the Supabase 'leads' table with automatic retry for transient errors.
   */
  async createLead(input: CreateLeadDbInput): Promise<DbServiceResult<LeadDbRow>> {
    try {
      const supabase = getSupabaseServerClient();

      const insertPayload = {
        full_name: input.full_name.trim(),
        company_name: input.company_name.trim(),
        email: input.email.trim().toLowerCase(),
        phone: input.phone?.trim() || null,
        website: input.website?.trim() || null,
        industry: input.industry.trim(),
        employees: input.employees.trim(),
        monthly_lead_volume: input.monthly_lead_volume.trim(),
        biggest_problem: input.biggest_problem.trim(),
        current_tools: input.current_tools.trim(),
        additional_information: input.additional_information?.trim() || null,
        lead_score: input.lead_score ?? null,
        classification: input.classification ?? null,
        business_type: input.business_type?.trim() || null,
        primary_problem: input.primary_problem?.trim() || null,
        automation_opportunity: input.automation_opportunity?.trim() || null,
        estimated_priority: input.estimated_priority ?? null,
        recommended_next_step: input.recommended_next_step?.trim() || null,
        ai_reasoning: input.ai_reasoning?.trim() || null,
        status: input.status || "NEW",
        source: input.source || "website_audit_form",
      };

      const { data, error } = await withDbRetry(
        async () => {
          return await supabase
            .from("leads")
            .insert(insertPayload)
            .select()
            .single();
        },
        { maxRetries: 2, delayMs: 200, label: "createLead" }
      );

      if (error) {
        // Safe server-side log: log code and sanitized message internally
        console.error(
          `[FlowFoundry DB] Error inserting lead for ${insertPayload.company_name} (Code: ${error.code}):`,
          maskSecrets(error.message)
        );
        return {
          success: false,
          error: "Failed to persist lead record in database",
        };
      }

      return {
        success: true,
        data: data as LeadDbRow,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown database connection error";
      console.error("[FlowFoundry DB] Unhandled database connection failure:", maskSecrets(message));
      return {
        success: false,
        error: "Database service temporarily unavailable",
      };
    }
  },

  /**
   * Checks for an existing lead submission with the same email within the last N minutes.
   * Used for idempotency and duplicate submission suppression.
   */
  async findRecentLeadByEmail(
    email: string,
    windowMinutes: number = 5
  ): Promise<DbServiceResult<LeadDbRow | null>> {
    try {
      const supabase = getSupabaseServerClient();
      const normalizedEmail = email.trim().toLowerCase();
      const cutoffTime = new Date(Date.now() - windowMinutes * 60 * 1000).toISOString();

      const { data, error } = await withDbRetry(
        async () => {
          return await supabase
            .from("leads")
            .select("*")
            .eq("email", normalizedEmail)
            .gte("created_at", cutoffTime)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();
        },
        { maxRetries: 2, delayMs: 150, label: "findRecentLeadByEmail" }
      );

      if (error) {
        console.error(
          `[FlowFoundry DB] Error checking duplicate lead for ${normalizedEmail}:`,
          maskSecrets(error.message)
        );
        return {
          success: false,
          error: "Failed to check for existing lead",
        };
      }

      return {
        success: true,
        data: (data as LeadDbRow) || null,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      console.error("[FlowFoundry DB] Query failure checking duplicate lead:", maskSecrets(message));
      return {
        success: false,
        error: "Database service temporarily unavailable",
      };
    }
  },

  /**
   * Retrieves a lead record by its UUID primary key.
   */
  async getLeadById(id: string): Promise<DbServiceResult<LeadDbRow | null>> {
    try {
      const supabase = getSupabaseServerClient();

      const { data, error } = await withDbRetry(
        async () => {
          return await supabase
            .from("leads")
            .select("*")
            .eq("id", id)
            .maybeSingle();
        },
        { maxRetries: 2, delayMs: 150, label: "getLeadById" }
      );

      if (error) {
        console.error(`[FlowFoundry DB] Error fetching lead ${id}:`, maskSecrets(error.message));
        return {
          success: false,
          error: "Failed to retrieve lead record",
        };
      }

      return {
        success: true,
        data: (data as LeadDbRow) || null,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      console.error(`[FlowFoundry DB] Failed to query lead ${id}:`, maskSecrets(message));
      return {
        success: false,
        error: "Database service temporarily unavailable",
      };
    }
  },

  /**
   * Retrieves all lead records matching a specific email address (indexed query).
   */
  async getLeadsByEmail(email: string): Promise<DbServiceResult<LeadDbRow[]>> {
    try {
      const supabase = getSupabaseServerClient();
      const normalizedEmail = email.trim().toLowerCase();

      const { data, error } = await withDbRetry(
        async () => {
          return await supabase
            .from("leads")
            .select("*")
            .eq("email", normalizedEmail)
            .order("created_at", { ascending: false });
        },
        { maxRetries: 2, delayMs: 150, label: "getLeadsByEmail" }
      );

      if (error) {
        console.error(`[FlowFoundry DB] Error querying leads by email:`, maskSecrets(error.message));
        return {
          success: false,
          error: "Failed to retrieve leads",
        };
      }

      return {
        success: true,
        data: (data as LeadDbRow[]) || [],
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      console.error("[FlowFoundry DB] Query failure by email:", maskSecrets(message));
      return {
        success: false,
        error: "Database service temporarily unavailable",
      };
    }
  },

  /**
   * Updates an existing lead record by ID (e.g. after AI qualification or status change).
   */
  async updateLead(
    id: string,
    updates: Partial<CreateLeadDbInput>
  ): Promise<DbServiceResult<LeadDbRow>> {
    try {
      const supabase = getSupabaseServerClient();

      const updatePayload: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      };

      if (updates.status !== undefined) updatePayload.status = updates.status;
      if (updates.lead_score !== undefined) updatePayload.lead_score = updates.lead_score;
      if (updates.classification !== undefined) updatePayload.classification = updates.classification;
      if (updates.business_type !== undefined) updatePayload.business_type = updates.business_type;
      if (updates.primary_problem !== undefined) updatePayload.primary_problem = updates.primary_problem;
      if (updates.automation_opportunity !== undefined) updatePayload.automation_opportunity = updates.automation_opportunity;
      if (updates.estimated_priority !== undefined) updatePayload.estimated_priority = updates.estimated_priority;
      if (updates.recommended_next_step !== undefined) updatePayload.recommended_next_step = updates.recommended_next_step;
      if (updates.ai_reasoning !== undefined) updatePayload.ai_reasoning = updates.ai_reasoning;

      const { data, error } = await withDbRetry(
        async () => {
          return await supabase
            .from("leads")
            .update(updatePayload)
            .eq("id", id)
            .select()
            .single();
        },
        { maxRetries: 2, delayMs: 150, label: "updateLead" }
      );

      if (error) {
        console.error(`[FlowFoundry DB] Error updating lead ${id}:`, maskSecrets(error.message));
        return {
          success: false,
          error: "Failed to update lead record",
        };
      }

      return {
        success: true,
        data: data as LeadDbRow,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      console.error(`[FlowFoundry DB] Failed to update lead ${id}:`, maskSecrets(message));
      return {
        success: false,
        error: "Database service temporarily unavailable",
      };
    }
  },

  /**
   * Lists leads with optional filtering and pagination.
   */
  async listLeads(options?: {
    status?: LeadStatus;
    classification?: LeadClassification;
    limit?: number;
    offset?: number;
  }): Promise<DbServiceResult<LeadDbRow[]>> {
    try {
      const supabase = getSupabaseServerClient();
      let query = supabase.from("leads").select("*", { count: "exact" });

      if (options?.status) {
        query = query.eq("status", options.status);
      }
      if (options?.classification) {
        query = query.eq("classification", options.classification);
      }

      const limit = options?.limit || 50;
      const offset = options?.offset || 0;

      query = query
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

      const { data, error } = await withDbRetry(
        async () => {
          return await query;
        },
        { maxRetries: 2, delayMs: 150, label: "listLeads" }
      );

      if (error) {
        console.error("[FlowFoundry DB] Error listing leads:", maskSecrets(error.message));
        return {
          success: false,
          error: "Failed to list leads",
        };
      }

      return {
        success: true,
        data: (data as LeadDbRow[]) || [],
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      console.error("[FlowFoundry DB] Query failure listing leads:", maskSecrets(message));
      return {
        success: false,
        error: "Database service temporarily unavailable",
      };
    }
  },

  /**
   * Deletes a single lead by ID.
   */
  async deleteLead(id: string): Promise<DbServiceResult<boolean>> {
    try {
      const supabase = getSupabaseServerClient();
      const { error } = await withDbRetry(
        async () => {
          return await supabase.from("leads").delete().eq("id", id);
        },
        { maxRetries: 2, delayMs: 150, label: "deleteLead" }
      );

      if (error) {
        console.error(`[FlowFoundry DB] Error deleting lead ${id}:`, maskSecrets(error.message));
        return {
          success: false,
          error: "Failed to delete lead",
        };
      }

      return {
        success: true,
        data: true,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      console.error(`[FlowFoundry DB] Failure deleting lead ${id}:`, maskSecrets(message));
      return {
        success: false,
        error: "Database service temporarily unavailable",
      };
    }
  },

  /**
   * Purges all leads from the leads table (Admin only with confirmation).
   */
  async purgeAllLeads(): Promise<DbServiceResult<{ deletedCount: number }>> {
    try {
      const supabase = getSupabaseServerClient();
      const { error, count } = await withDbRetry(
        async () => {
          return await supabase
            .from("leads")
            .delete({ count: "exact" })
            .neq("id", "00000000-0000-0000-0000-000000000000");
        },
        { maxRetries: 2, delayMs: 200, label: "purgeAllLeads" }
      );

      if (error) {
        console.error("[FlowFoundry DB] Error purging leads table:", maskSecrets(error.message));
        return {
          success: false,
          error: "Failed to purge database records",
        };
      }

      return {
        success: true,
        data: { deletedCount: count ?? 0 },
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      console.error("[FlowFoundry DB] Failure during database purge:", maskSecrets(message));
      return {
        success: false,
        error: "Database service temporarily unavailable",
      };
    }
  },
};

