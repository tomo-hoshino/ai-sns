import { describe, expect, it } from "vitest";

import { formatRelativeTime } from "@/features/posts/utils/format-relative-time";

describe("formatRelativeTime", () => {
  it("formats a past ISO datetime as Japanese relative time", () => {
    const now = new Date("2026-07-18T12:00:00.000Z");
    const createdAt = "2026-07-18T11:00:00.000Z";

    expect(formatRelativeTime(createdAt, now)).toBe("約1時間前");
  });

  it("returns a safe label for invalid datetime strings", () => {
    expect(formatRelativeTime("not-a-date")).toBe("日時不明");
  });
});
