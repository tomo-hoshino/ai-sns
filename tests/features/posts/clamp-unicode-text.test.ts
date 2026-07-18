import { describe, expect, it } from "vitest";

import { clampUnicodeText } from "@/features/posts/utils/clamp-unicode-text";

describe("clampUnicodeText", () => {
  it("returns the original string when within the limit", () => {
    expect(clampUnicodeText("hello", 5)).toBe("hello");
    expect(clampUnicodeText("あいう", 10)).toBe("あいう");
  });

  it("truncates by Unicode code points, not UTF-16 units", () => {
    expect(clampUnicodeText("あいうえお", 3)).toBe("あいう");
    expect(clampUnicodeText("👍👎🎉", 2)).toBe("👍👎");
  });

  it("returns an empty string for non-positive limits", () => {
    expect(clampUnicodeText("abc", 0)).toBe("");
    expect(clampUnicodeText("abc", -1)).toBe("");
  });
});
