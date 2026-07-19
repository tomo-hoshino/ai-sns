import "server-only";

import type { User } from "@supabase/supabase-js";

import { tryParsePublicEnv } from "@/lib/env";
import { createSupabaseSessionClient } from "@/lib/supabase/session";

/**
 * Returns the Auth user when public env and session are available.
 * Missing anon key (local misconfig) yields null so public pages still render.
 */
export async function getSessionUser(): Promise<User | null> {
  const publicEnv = tryParsePublicEnv({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  });
  if (publicEnv === null) {
    return null;
  }

  const supabase = await createSupabaseSessionClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}
