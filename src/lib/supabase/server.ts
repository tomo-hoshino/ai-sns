import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { getEnv } from "@/lib/env";
import type { Database } from "@/types/database";

let client: SupabaseClient<Database> | undefined;

/**
 * Lazily create a singleton Supabase client with the service role key.
 * Browser/client bundles must not import this module.
 */
export function getSupabaseServerClient(): SupabaseClient<Database> {
  if (client) {
    return client;
  }

  const env = getEnv();

  client = createClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );

  return client;
}
