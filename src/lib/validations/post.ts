import { z } from "zod";

import {
  countUnicodeCodePoints,
  DEFAULT_TIMELINE_LIMIT,
  MAX_POST_LENGTH,
  opaqueCursorSchema,
  timelineLimitSchema,
} from "@/lib/validations/common";

export const postContentSchema = z
  .string({
    error: "投稿内容を入力してください。",
  })
  .transform((value) => value.trim())
  .superRefine((value, ctx) => {
    const length = countUnicodeCodePoints(value);

    if (length < 1) {
      ctx.addIssue({
        code: "custom",
        message: "投稿内容を入力してください。",
      });
      return;
    }

    if (length > MAX_POST_LENGTH) {
      ctx.addIssue({
        code: "custom",
        message: "投稿は300文字以内で入力してください。",
      });
    }
  });

export const createPostRequestSchema = z.strictObject({
  content: postContentSchema,
});

export const listPostsQuerySchema = z.strictObject({
  limit: z.preprocess((value) => {
    if (value === undefined || value === "") {
      return DEFAULT_TIMELINE_LIMIT;
    }
    return value;
  }, timelineLimitSchema),
  cursor: opaqueCursorSchema.optional(),
});

export type CreatePostRequestInput = z.input<typeof createPostRequestSchema>;
export type CreatePostRequestParsed = z.output<typeof createPostRequestSchema>;
export type ListPostsQueryParsed = z.output<typeof listPostsQuerySchema>;
