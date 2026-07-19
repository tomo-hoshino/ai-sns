import { describe, expect, it } from "vitest";

import { parseMagicLinkEmail } from "@/lib/validations/auth";

describe("parseMagicLinkEmail", () => {
  it("accepts a trimmed valid email", () => {
    expect(parseMagicLinkEmail("  you@example.com  ")).toEqual({
      success: true,
      email: "you@example.com",
    });
  });

  it("rejects an empty value", () => {
    expect(parseMagicLinkEmail("")).toEqual({
      success: false,
      message: "メールアドレスを入力してください",
    });
  });

  it("rejects whitespace-only values", () => {
    expect(parseMagicLinkEmail("   ")).toEqual({
      success: false,
      message: "メールアドレスを入力してください",
    });
  });

  it("rejects an invalid email", () => {
    expect(parseMagicLinkEmail("not-an-email")).toEqual({
      success: false,
      message: "有効なメールアドレスを入力してください",
    });
  });
});
