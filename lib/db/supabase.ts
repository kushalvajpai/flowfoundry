import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let serverClient: SupabaseClient | null = null;

/**
 * Creates or retrieves a singleton Supabase client for server-side operations.
 *
 * Security:
 * - Server-side only: Prevents execution in browser contexts to protect privileged access.
 * - Uses SUPABASE_SERVICE_ROLE_KEY for privileged persistence (or falls back to SUPABASE_ANON_KEY).
 * - Never expose credentials to the client bundle.
 */
export function getSupabaseServerClient(): SupabaseClient {
  if (typeof window !== "undefined") {
    throw new Error("Supabase server client must only be invoked in a server runtime environment.");
  }

  if (serverClient) {
    return serverClient;
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error("[FlowFoundry DB] Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY / SUPABASE_ANON_KEY environment variables.");
    throw new Error("Database configuration error");
  }

  serverClient = createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  return serverClient;
}
