import type { Account } from "@/types/account";

/** SPEC.md 5.2 と同じ候補抽出パターン。 */
const MENTION_HANDLE_PATTERN = /@([a-z0-9-]+)/gi;

export type TextContentSegment =
  | { type: "text"; value: string }
  | { type: "mention"; value: string; account: Account };

/**
 * 投稿本文を通常テキストと有効AIメンションへ分割する。
 * HTMLは生成せず、描画側はReact textとして扱う。
 */
export function splitContentWithMentions(
  content: string,
  aiAccounts: readonly Account[],
): TextContentSegment[] {
  const accountsByHandle = new Map<string, Account>();
  for (const account of aiAccounts) {
    accountsByHandle.set(account.handle.toLowerCase(), account);
  }

  const segments: TextContentSegment[] = [];
  let lastIndex = 0;

  for (const match of content.matchAll(MENTION_HANDLE_PATTERN)) {
    const matchIndex = match.index;
    if (matchIndex === undefined) {
      continue;
    }

    const rawHandle = match[1];
    if (rawHandle === undefined) {
      continue;
    }

    const account = accountsByHandle.get(rawHandle.toLowerCase());
    if (account === undefined) {
      continue;
    }

    if (matchIndex > lastIndex) {
      segments.push({
        type: "text",
        value: content.slice(lastIndex, matchIndex),
      });
    }

    segments.push({
      type: "mention",
      value: match[0],
      account,
    });
    lastIndex = matchIndex + match[0].length;
  }

  if (lastIndex < content.length) {
    segments.push({
      type: "text",
      value: content.slice(lastIndex),
    });
  }

  if (segments.length === 0) {
    return [{ type: "text", value: content }];
  }

  return segments;
}
