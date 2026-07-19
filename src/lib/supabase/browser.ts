import { createBrowserClient } from "@supabase/ssr";

import type { Database } from "@/types/database";

function requirePublicEnv(
  name: "NEXT_PUBLIC_SUPABASE_URL" | "NEXT_PUBLIC_SUPABASE_ANON_KEY",
): string {
  const value = process.env[name];
  if (value === undefined || value.trim() === "") {
    throw new Error(`Invalid environment variables:\n${name}: Required`);
  }
  return value;
}

/**
 * Browser Supabase client for Auth (magic link / session cookies) only.
 * Do not use for profiles/posts Data API access from the browser.
 */
export function createSupabaseBrowserClient() {
  return createBrowserClient<Database>(
    requirePublicEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requirePublicEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
  );
}
