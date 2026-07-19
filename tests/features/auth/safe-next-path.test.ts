import { describe, expect, it } from "vitest";

import { resolveSafeNextPath } from "@/features/auth/utils/safe-next-path";

describe("resolveSafeNextPath", () => {
  it("defaults to home for empty values", () => {
    expect(resolveSafeNextPath(undefined)).toBe("/");
    expect(resolveSafeNextPath(null)).toBe("/");
    expect(resolveSafeNextPath("")).toBe("/");
    expect(resolveSafeNextPath("   ")).toBe("/");
  });

  it("allows same-origin relative paths", () => {
    expect(resolveSafeNextPath("/")).toBe("/");
    expect(resolveSafeNextPath("/posts/abc")).toBe("/posts/abc");
  });

  it("rejects open redirects", () => {
    expect(resolveSafeNextPath("//evil.example")).toBe("/");
    expect(resolveSafeNextPath("https://evil.example")).toBe("/");
    expect(resolveSafeNextPath("posts/abc")).toBe("/");
  });
});
