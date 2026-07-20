import { createBrowserClient } from "@supabase/ssr";

import type { Database } from "@/types/database";

/**
 * Browser Supabase client for Auth (magic link / session cookies) only.
 * Do not use for profiles/posts Data API access from the browser.
 *
 * NEXT_PUBLIC_* must be read with static property access so Next.js can
 * inline them into the client bundle at build time.
 */
export function createSupabaseBrowserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (url === undefined || url.trim() === "") {
    throw new Error(
      "Invalid environment variables:\nNEXT_PUBLIC_SUPABASE_URL: Required",
    );
  }

  if (anonKey === undefined || anonKey.trim() === "") {
    throw new Error(
      "Invalid environment variables:\nNEXT_PUBLIC_SUPABASE_ANON_KEY: Required",
    );
  }

  return createBrowserClient<Database>(url, anonKey);
}
