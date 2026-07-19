import { buildAccountsByMentionHandle } from "@/lib/ai/mentions";
import type { Account } from "@/types/account";

/** SPEC.md 5.2 と同じ候補抽出パターン。 */
const MENTION_HANDLE_PATTERN = /@([a-z0-9-]+)/gi;

export type TextContentSegment =
  | { type: "text"; value: string }
  | { type: "mention"; value: string; account: Account };

/**
 * 投稿本文を通常テキストと有効AIメンションへ分割する。
 * HTMLは生成せず、描画側はReact textとして扱う。
 * 旧handle（legacy alias）も正規Accountへ解決して強調する。
 */
export function splitContentWithMentions(
  content: string,
  aiAccounts: readonly Account[],
): TextContentSegment[] {
  const accountsByMentionHandle = buildAccountsByMentionHandle(aiAccounts);

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

    const account = accountsByMentionHandle.get(rawHandle.toLowerCase());
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
