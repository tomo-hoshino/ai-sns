import type { Account } from "@/types/account";

/** SPEC.md 5.2: `/@([a-z0-9-]+)/gi` で候補を抽出し、AI handle と完全一致させる。 */
const MENTION_HANDLE_PATTERN = /@([a-z0-9-]+)/gi;

const MAX_MENTIONED_AI = 4;

/**
 * SPEC.md §11.6.3 / ADR-008:
 * 旧handleを正規Accountへ解決する。候補UIは正規handleだけを挿入する。
 */
export const LEGACY_AI_HANDLE_ALIASES = {
  "backend-ai": "sendo-ai",
  "frontend-ai": "sora-ai",
  "reviewer-ai": "hiyori-ai",
  "pm-ai": "kaname-ai",
} as const satisfies Record<string, string>;

/**
 * 正規handleとlegacy aliasの両方から同じAccountを引けるlookupを作る。
 */
export function buildAccountsByMentionHandle(
  aiAccounts: readonly Account[],
): Map<string, Account> {
  const accountsByCanonicalHandle = new Map<string, Account>();
  for (const account of aiAccounts) {
    accountsByCanonicalHandle.set(account.handle.toLowerCase(), account);
  }

  const accountsByMentionHandle = new Map<string, Account>(
    accountsByCanonicalHandle,
  );

  for (const [legacyHandle, canonicalHandle] of Object.entries(
    LEGACY_AI_HANDLE_ALIASES,
  )) {
    const account = accountsByCanonicalHandle.get(canonicalHandle);
    if (account === undefined) {
      continue;
    }
    accountsByMentionHandle.set(legacyHandle, account);
  }

  return accountsByMentionHandle;
}

/**
 * 投稿本文から有効なAIメンションを出現順で抽出する。
 * 大文字小文字を無視した完全一致、アカウント単位の重複排除、最大4件を保証する。
 * 旧handle（legacy alias）も同じAccountへ解決する。
 */
export function extractMentionedAiAccounts(
  content: string,
  aiAccounts: readonly Account[],
): Account[] {
  const accountsByMentionHandle = buildAccountsByMentionHandle(aiAccounts);

  const mentioned: Account[] = [];
  const seenAccountIds = new Set<string>();

  for (const match of content.matchAll(MENTION_HANDLE_PATTERN)) {
    const rawHandle = match[1];
    if (rawHandle === undefined) {
      continue;
    }

    const account = accountsByMentionHandle.get(rawHandle.toLowerCase());
    if (account === undefined) {
      continue;
    }

    if (seenAccountIds.has(account.id)) {
      continue;
    }

    seenAccountIds.add(account.id);
    mentioned.push(account);

    if (mentioned.length >= MAX_MENTIONED_AI) {
      break;
    }
  }

  return mentioned;
}
