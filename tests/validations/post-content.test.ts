import { describe, expect, it } from "vitest";

import { countUnicodeCodePoints } from "@/lib/validations/common";
import {
  createPostRequestSchema,
  postContentSchema,
} from "@/lib/validations/post";

describe("countUnicodeCodePoints", () => {
  it("counts ASCII and emoji as Unicode code points", () => {
    expect(countUnicodeCodePoints("abc")).toBe(3);
    expect(countUnicodeCodePoints("👍")).toBe(1);
    expect(countUnicodeCodePoints("あ👍い")).toBe(3);
  });
});

describe("postContentSchema", () => {
  it("rejects empty string and whitespace-only content", () => {
    expect(postContentSchema.safeParse("").success).toBe(false);
    expect(postContentSchema.safeParse("   ").success).toBe(false);
    expect(postContentSchema.safeParse("\n\t").success).toBe(false);
  });

  it("trims surrounding whitespace before accepting content", () => {
    const result = postContentSchema.safeParse("  hello  ");
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBe("hello");
    }
  });

  it("accepts exactly 300 Unicode code points", () => {
    const content = "あ".repeat(300);
    expect(countUnicodeCodePoints(content)).toBe(300);

    const result = postContentSchema.safeParse(content);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBe(content);
    }
  });

  it("rejects 301 Unicode code points", () => {
    const content = "あ".repeat(301);
    expect(countUnicodeCodePoints(content)).toBe(301);

    const result = postContentSchema.safeParse(content);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(
        "投稿は300文字以内で入力してください。",
      );
    }
  });

  it("counts emoji toward the 300-character limit", () => {
    const content = `${"あ".repeat(299)}😀`;
    expect(countUnicodeCodePoints(content)).toBe(300);
    expect(postContentSchema.safeParse(content).success).toBe(true);

    const tooLong = `${"あ".repeat(300)}😀`;
    expect(countUnicodeCodePoints(tooLong)).toBe(301);
    expect(postContentSchema.safeParse(tooLong).success).toBe(false);
  });
});

describe("createPostRequestSchema", () => {
  it("accepts a valid content field", () => {
    const result = createPostRequestSchema.safeParse({
      content: "  @backend-ai 確認して  ",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({
        content: "@backend-ai 確認して",
      });
    }
  });

  it("rejects unknown properties because the object is strict", () => {
    const result = createPostRequestSchema.safeParse({
      content: "hello",
      extra: true,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(
        result.error.issues.some((issue) => issue.code === "unrecognized_keys"),
      ).toBe(true);
    }
  });
});
