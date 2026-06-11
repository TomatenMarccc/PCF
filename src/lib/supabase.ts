import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { env } from "../config/env.js";

let client: SupabaseClient | undefined;
let adminClient: SupabaseClient | undefined;

export function getSupabaseClient(): SupabaseClient {
  if (!env.supabaseUrl || !env.supabasePublishableKey) {
    throw new Error(
      "Supabase is not configured. Set SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY in .env.",
    );
  }

  client ??= createClient(env.supabaseUrl, env.supabasePublishableKey);

  return client;
}

export function getSupabaseAdminClient(): SupabaseClient {
  if (!env.supabaseUrl || !env.supabaseServiceRoleKey) {
    throw new Error(
      "Supabase write access is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.",
    );
  }

  adminClient ??= createClient(env.supabaseUrl, env.supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return adminClient;
}
