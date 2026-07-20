import { z } from "zod";

import type { ApiErrorCode } from "@/types/api";
import type { TimelinePageCursor } from "@/types/post";

export const MAX_POST_LENGTH = 300;
export const DEFAULT_TIMELINE_LIMIT = 20;
export const MAX_TIMELINE_LIMIT = 50;

export const API_ERROR_CODES = [
  "VALIDATION_ERROR",
  "UNAUTHORIZED",
  "THREAD_NOT_FOUND",
  "PROFILE_NOT_FOUND",
  "METHOD_NOT_ALLOWED",
  "DATABASE_ERROR",
  "INTERNAL_ERROR",
] as const satisfies readonly ApiErrorCode[];

/** Count characters the same way as SPEC/API: Unicode code points. */
export function countUnicodeCodePoints(value: string): number {
  return Array.from(value).length;
}

export const uuidSchema = z.uuid({
  error: "有効なUUIDを指定してください。",
});

export const timelineLimitSchema = z.coerce
  .number({
    error: "limitは整数で指定してください。",
  })
  .int("limitは整数で指定してください。")
  .min(1, "limitは1以上で指定してください。")
  .max(
    MAX_TIMELINE_LIMIT,
    `limitは${MAX_TIMELINE_LIMIT}以下で指定してください。`,
  );

export const timelineCursorPayloadSchema = z.strictObject({
  createdAt: z.iso.datetime({
    error: "cursorが不正です。",
  }),
  id: uuidSchema,
});

export function encodeTimelineCursor(cursor: TimelinePageCursor): string {
  const payload = timelineCursorPayloadSchema.parse(cursor);
  return Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
}

/**
 * Decode an opaque timeline cursor.
 * Invalid input becomes a Zod validation failure (no thrown Error).
 */
export function decodeTimelineCursor(
  raw: string,
): z.ZodSafeParseResult<TimelinePageCursor> {
  const parsed = parseBase64UrlJson(raw);
  return timelineCursorPayloadSchema.safeParse(parsed);
}

export const opaqueCursorSchema = z.string().transform((raw, ctx) => {
  const result = decodeTimelineCursor(raw);
  if (!result.success) {
    ctx.addIssue({
      code: "custom",
      message: "cursorが不正です。",
    });
    return z.NEVER;
  }

  return result.data;
});

export const apiErrorCodeSchema = z.enum(API_ERROR_CODES);

export const apiErrorDetailSchema = z.strictObject({
  path: z.string(),
  message: z.string(),
});

export const apiErrorResponseSchema = z.strictObject({
  error: z.strictObject({
    code: apiErrorCodeSchema,
    message: z.string().min(1),
    details: z.array(apiErrorDetailSchema).optional(),
  }),
  requestId: uuidSchema,
});

/** Returns parsed JSON, or undefined when the opaque cursor cannot be read. */
function parseBase64UrlJson(raw: string): unknown {
  if (raw.length === 0) {
    return undefined;
  }

  try {
    const text = Buffer.from(raw, "base64url").toString("utf8");
    if (text.length === 0) {
      return undefined;
    }

    const parsed: unknown = JSON.parse(text);
    return parsed;
  } catch {
    return undefined;
  }
}
