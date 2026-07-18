import type { Account, AccountType, PersonaKey } from "@/types/account";

import { RepositoryError } from "@/lib/repositories/errors";

const ACCOUNT_TYPES = ["human", "ai"] as const;
const PERSONA_KEYS = ["backend", "frontend", "reviewer", "pm"] as const;

export type ProfileRowInput = {
  id: string;
  handle: string;
  display_name: string;
  bio: string;
  account_type: string;
  persona_key: string | null;
  avatar_path: string;
};

function isAccountType(value: string): value is AccountType {
  return (ACCOUNT_TYPES as readonly string[]).includes(value);
}

function isPersonaKey(value: string): value is PersonaKey {
  return (PERSONA_KEYS as readonly string[]).includes(value);
}

function parseAccountType(value: string): AccountType {
  if (!isAccountType(value)) {
    throw new RepositoryError("Invalid account_type in profile row");
  }
  return value;
}

function parsePersonaKey(
  accountType: AccountType,
  personaKey: string | null,
): PersonaKey | null {
  if (accountType === "human") {
    if (personaKey !== null) {
      throw new RepositoryError("Human profile must have null persona_key");
    }
    return null;
  }

  if (personaKey === null || !isPersonaKey(personaKey)) {
    throw new RepositoryError("AI profile has invalid persona_key");
  }

  return personaKey;
}

/**
 * Maps a profiles DB row (snake_case) to the Account domain type (camelCase).
 */
export function mapAccount(row: ProfileRowInput): Account {
  const accountType = parseAccountType(row.account_type);
  const personaKey = parsePersonaKey(accountType, row.persona_key);

  return {
    id: row.id,
    handle: row.handle,
    displayName: row.display_name,
    bio: row.bio,
    accountType,
    personaKey,
    avatarPath: row.avatar_path,
  };
}

export function isProfileRow(value: unknown): value is ProfileRowInput {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  if (
    !("id" in value) ||
    !("handle" in value) ||
    !("display_name" in value) ||
    !("bio" in value) ||
    !("account_type" in value) ||
    !("persona_key" in value) ||
    !("avatar_path" in value)
  ) {
    return false;
  }

  return (
    typeof value.id === "string" &&
    typeof value.handle === "string" &&
    typeof value.display_name === "string" &&
    typeof value.bio === "string" &&
    typeof value.account_type === "string" &&
    (value.persona_key === null || typeof value.persona_key === "string") &&
    typeof value.avatar_path === "string"
  );
}

export function mapAccountFromUnknown(value: unknown): Account {
  if (!isProfileRow(value)) {
    throw new RepositoryError("Invalid profile row shape from database");
  }
  return mapAccount(value);
}
