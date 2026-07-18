import "server-only";

import { findAiAccounts } from "@/lib/repositories/account-repository";
import { RepositoryError } from "@/lib/repositories/errors";
import { listAiAccountsResponseSchema } from "@/lib/validations/post";
import type { ListAiAccountsResponse } from "@/types/api";
import type { Account, PersonaKey } from "@/types/account";

/** Fixed display order from API.md — independent of DB created_at. */
const PERSONA_ORDER = [
  "backend",
  "frontend",
  "reviewer",
  "pm",
] as const satisfies readonly PersonaKey[];

export type GetAiAccountsDeps = {
  findAiAccounts: () => Promise<Account[]>;
};

const defaultDeps: GetAiAccountsDeps = {
  findAiAccounts,
};

/**
 * Returns AI accounts only, sorted by the fixed persona order.
 * Invalid persona keys or unexpected human rows surface as repository errors.
 */
export async function getAiAccounts(
  deps: GetAiAccountsDeps = defaultDeps,
): Promise<ListAiAccountsResponse> {
  const accounts = await deps.findAiAccounts();
  const aiAccounts = accounts.map(requireAiAccount);
  const sorted = sortByPersonaOrder(aiAccounts);

  const response = {
    data: sorted,
  } satisfies ListAiAccountsResponse;

  return listAiAccountsResponseSchema.parse(response);
}

type AiAccount = Account & {
  accountType: "ai";
  personaKey: PersonaKey;
};

function requireAiAccount(account: Account): AiAccount {
  if (account.accountType !== "ai") {
    throw new RepositoryError("AI accounts query returned a non-AI account");
  }

  if (account.personaKey === null) {
    throw new RepositoryError("AI account is missing persona_key");
  }

  return {
    ...account,
    accountType: "ai",
    personaKey: account.personaKey,
  };
}

function sortByPersonaOrder(accounts: AiAccount[]): AiAccount[] {
  return [...accounts].sort(
    (left, right) =>
      personaOrderIndex(left.personaKey) - personaOrderIndex(right.personaKey),
  );
}

function personaOrderIndex(personaKey: PersonaKey): number {
  const index = PERSONA_ORDER.indexOf(personaKey);
  if (index === -1) {
    throw new RepositoryError(`Unknown persona_key: ${personaKey}`);
  }
  return index;
}
