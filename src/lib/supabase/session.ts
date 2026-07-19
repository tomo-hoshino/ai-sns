import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { parsePublicEnv } from "@/lib/env";
import type { Database } from "@/types/database";

/**
 * Cookie-backed Supabase client for Auth session on the server.
 * Distinct from the service-role client in server.ts (repository / AI writes).
 */
export async function createSupabaseSessionClient() {
  const env = parsePublicEnv({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  });
  const cookieStore = await cookies();

  return createServerClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Called from a Server Component where cookies are read-only.
            // Session refresh is handled by proxy.ts.
          }
        },
      },
    },
  );
}
