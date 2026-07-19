import "server-only";

import type { Account } from "@/types/account";

import { RepositoryError } from "@/lib/repositories/errors";
import { mapAccountFromUnknown } from "@/lib/repositories/map-account";
import { getSupabaseServerClient } from "@/lib/supabase/server";

/** Legacy seeded human `@you` (ARCHITECTURE.md §6.5). Not used for new posts. */
export const FIXED_HUMAN_ACCOUNT_ID =
  "00000000-0000-4000-8000-000000000001" as const;

const PROFILE_COLUMNS =
  "id, handle, display_name, bio, account_type, persona_key, avatar_path" as const;

/**
 * Loads a human profile by id (`profiles.id = auth.users.id` for Auth users).
 * Returns null when the row is missing or not a human account.
 */
export async function findHumanAccountById(
  accountId: string,
): Promise<Account | null> {
  const client = getSupabaseServerClient();
  const { data, error } = await client
    .from("profiles")
    .select(PROFILE_COLUMNS)
    .eq("id", accountId)
    .eq("account_type", "human")
    .maybeSingle();

  if (error) {
    throw new RepositoryError("Failed to load human account", {
      cause: error,
    });
  }

  if (data === null) {
    return null;
  }

  return mapAccountFromUnknown(data);
}

/**
 * Loads all AI accounts. Order is not guaranteed; callers that need a fixed
 * persona order must sort in the service layer.
 */
export async function findAiAccounts(): Promise<Account[]> {
  const client = getSupabaseServerClient();
  const { data, error } = await client
    .from("profiles")
    .select(PROFILE_COLUMNS)
    .eq("account_type", "ai");

  if (error) {
    throw new RepositoryError("Failed to load AI accounts", { cause: error });
  }

  if (data === null) {
    throw new RepositoryError("AI accounts query returned null data");
  }

  return data.map((row) => mapAccountFromUnknown(row));
}
