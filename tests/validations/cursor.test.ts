import { describe, expect, it } from "vitest";

import {
  decodeTimelineCursor,
  encodeTimelineCursor,
  opaqueCursorSchema,
  timelineLimitSchema,
  uuidSchema,
} from "@/lib/validations/common";
import { listPostsQuerySchema } from "@/lib/validations/post";

const validCursor = {
  createdAt: "2026-07-18T03:00:00.000Z",
  id: "6c2671cd-15f2-464e-bdd7-46c0de4ae342",
};

describe("uuidSchema", () => {
  it("accepts a valid UUID", () => {
    expect(uuidSchema.safeParse(validCursor.id).success).toBe(true);
  });

  it("rejects a non-UUID string", () => {
    expect(uuidSchema.safeParse("not-a-uuid").success).toBe(false);
  });
});

describe("timelineLimitSchema", () => {
  it("accepts values from 1 to 50", () => {
    expect(timelineLimitSchema.safeParse(1).success).toBe(true);
    expect(timelineLimitSchema.safeParse("20").success).toBe(true);
    expect(timelineLimitSchema.safeParse(50).success).toBe(true);
  });

  it("rejects values outside 1..50", () => {
    expect(timelineLimitSchema.safeParse(0).success).toBe(false);
    expect(timelineLimitSchema.safeParse(51).success).toBe(false);
    expect(timelineLimitSchema.safeParse("abc").success).toBe(false);
  });
});

describe("timeline cursor encode/decode", () => {
  it("round-trips a valid cursor as opaque base64url", () => {
    const encoded = encodeTimelineCursor(validCursor);

    expect(encoded).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(encoded.includes("+")).toBe(false);
    expect(encoded.includes("/")).toBe(false);

    const decoded = decodeTimelineCursor(encoded);
    expect(decoded.success).toBe(true);
    if (decoded.success) {
      expect(decoded.data).toEqual(validCursor);
    }
  });

  it("decodes the API.md example cursor", () => {
    const example =
      "eyJjcmVhdGVkQXQiOiIyMDI2LTA3LTE4VDAzOjAwOjAwLjAwMFoiLCJpZCI6IjZjMjY3MWNkLTE1ZjItNDY0ZS1iZGQ3LTQ2YzBkZTRhZTM0MiJ9";

    const decoded = decodeTimelineCursor(example);
    expect(decoded.success).toBe(true);
    if (decoded.success) {
      expect(decoded.data).toEqual(validCursor);
    }
  });

  it("returns a validation error for invalid cursors without throwing", () => {
    const cases = [
      "",
      "not-base64",
      Buffer.from("{}", "utf8").toString("base64url"),
      Buffer.from('{"createdAt":"bad","id":"also-bad"}', "utf8").toString(
        "base64url",
      ),
      Buffer.from(
        JSON.stringify({ createdAt: validCursor.createdAt }),
        "utf8",
      ).toString("base64url"),
      Buffer.from(
        JSON.stringify({ ...validCursor, extra: true }),
        "utf8",
      ).toString("base64url"),
    ];

    for (const raw of cases) {
      expect(() => decodeTimelineCursor(raw)).not.toThrow();

      const result = decodeTimelineCursor(raw);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.length).toBeGreaterThan(0);
      }
    }
  });

  it("fails opaqueCursorSchema for an invalid cursor", () => {
    const result = opaqueCursorSchema.safeParse("%%%invalid%%%");
    expect(result.success).toBe(false);
  });
});

describe("listPostsQuerySchema", () => {
  it("defaults limit to 20 when omitted", () => {
    const result = listPostsQuerySchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.limit).toBe(20);
      expect(result.data.cursor).toBeUndefined();
    }
  });

  it("decodes an optional cursor", () => {
    const encoded = encodeTimelineCursor(validCursor);
    const result = listPostsQuerySchema.safeParse({
      limit: "10",
      cursor: encoded,
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({
        limit: 10,
        cursor: validCursor,
      });
    }
  });

  it("rejects an invalid cursor as a validation error", () => {
    const result = listPostsQuerySchema.safeParse({
      cursor: "broken-cursor",
    });

    expect(result.success).toBe(false);
  });
});
