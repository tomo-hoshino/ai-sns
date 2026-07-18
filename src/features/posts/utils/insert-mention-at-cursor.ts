import { clampUnicodeText } from "@/features/posts/utils/clamp-unicode-text";
import { MAX_POST_LENGTH } from "@/lib/validations/common";

export type InsertMentionAtCursorInput = {
  content: string;
  handle: string;
  selectionStart: number;
  selectionEnd: number;
  maxLength?: number;
};

export type InsertMentionAtCursorResult = {
  content: string;
  cursor: number;
};

/**
 * Inserts `@handle` at the textarea selection without discarding surrounding text.
 * Adds spacing only when needed so existing words are not glued together.
 * Result is clamped to `maxLength` Unicode code points.
 */
export function insertMentionAtCursor(
  input: InsertMentionAtCursorInput,
): InsertMentionAtCursorResult {
  const maxLength = input.maxLength ?? MAX_POST_LENGTH;
  const contentLength = input.content.length;
  const selectionStart = clampIndex(input.selectionStart, contentLength);
  const selectionEnd = Math.max(
    selectionStart,
    clampIndex(input.selectionEnd, contentLength),
  );

  const before = input.content.slice(0, selectionStart);
  const after = input.content.slice(selectionEnd);
  const mention = `@${input.handle}`;
  const leadingSpace = needsLeadingSpace(before) ? " " : "";
  const trailingSpace = needsTrailingSpace(after) ? " " : "";
  const insertion = `${leadingSpace}${mention}${trailingSpace}`;
  const nextContent = clampUnicodeText(
    `${before}${insertion}${after}`,
    maxLength,
  );

  const idealCursor = before.length + insertion.length;
  const cursor = Math.min(idealCursor, nextContent.length);

  return {
    content: nextContent,
    cursor,
  };
}

function clampIndex(index: number, length: number): number {
  if (!Number.isFinite(index)) {
    return 0;
  }

  return Math.max(0, Math.min(Math.trunc(index), length));
}

function needsLeadingSpace(before: string): boolean {
  if (before.length === 0) {
    return false;
  }

  return !/\s$/u.test(before);
}

function needsTrailingSpace(after: string): boolean {
  if (after.length === 0) {
    return true;
  }

  return !/^\s/u.test(after);
}
