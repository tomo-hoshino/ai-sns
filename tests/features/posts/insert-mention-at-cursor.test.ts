import { describe, expect, it } from "vitest";

import { insertMentionAtCursor } from "@/features/posts/utils/insert-mention-at-cursor";

describe("insertMentionAtCursor", () => {
  it("inserts a mention at the cursor without discarding surrounding text", () => {
    const result = insertMentionAtCursor({
      content: "前半後半",
      handle: "sendo-ai",
      selectionStart: 2,
      selectionEnd: 2,
    });

    expect(result.content).toBe("前半 @sendo-ai 後半");
    expect(result.cursor).toBe("前半 @sendo-ai ".length);
  });

  it("replaces the current selection with the mention", () => {
    const result = insertMentionAtCursor({
      content: "hello world",
      handle: "kaname-ai",
      selectionStart: 6,
      selectionEnd: 11,
    });

    expect(result.content).toBe("hello @kaname-ai ");
  });

  it("does not add an extra leading space after existing whitespace", () => {
    const result = insertMentionAtCursor({
      content: "hello ",
      handle: "sora-ai",
      selectionStart: 6,
      selectionEnd: 6,
    });

    expect(result.content).toBe("hello @sora-ai ");
  });

  it("clamps the result to the max Unicode length", () => {
    const result = insertMentionAtCursor({
      content: "あいうえお",
      handle: "sendo-ai",
      selectionStart: 5,
      selectionEnd: 5,
      maxLength: 10,
    });

    expect(Array.from(result.content)).toHaveLength(10);
    expect(result.content.startsWith("あいうえお")).toBe(true);
  });
});
