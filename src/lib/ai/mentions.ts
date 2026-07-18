import type { Account } from "@/types/account";

/** SPEC.md 5.2: `/@([a-z0-9-]+)/gi` で候補を抽出し、AI handle と完全一致させる。 */
const MENTION_HANDLE_PATTERN = /@([a-z0-9-]+)/gi;

const MAX_MENTIONED_AI = 4;

/**
 * 投稿本文から有効なAIメンションを出現順で抽出する。
 * 大文字小文字を無視した完全一致、重複排除、最大4件を保証する。
 */
export function extractMentionedAiAccounts(
  content: string,
  aiAccounts: readonly Account[],
): Account[] {
  const accountsByHandle = new Map<string, Account>();
  for (const account of aiAccounts) {
    accountsByHandle.set(account.handle.toLowerCase(), account);
  }

  const mentioned: Account[] = [];
  const seenHandles = new Set<string>();

  for (const match of content.matchAll(MENTION_HANDLE_PATTERN)) {
    const rawHandle = match[1];
    if (rawHandle === undefined) {
      continue;
    }

    const normalizedHandle = rawHandle.toLowerCase();
    if (seenHandles.has(normalizedHandle)) {
      continue;
    }

    const account = accountsByHandle.get(normalizedHandle);
    if (account === undefined) {
      continue;
    }

    seenHandles.add(normalizedHandle);
    mentioned.push(account);

    if (mentioned.length >= MAX_MENTIONED_AI) {
      break;
    }
  }

  return mentioned;
}
