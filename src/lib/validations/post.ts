import { z } from "zod";

import {
  countUnicodeCodePoints,
  DEFAULT_TIMELINE_LIMIT,
  MAX_POST_LENGTH,
  opaqueCursorSchema,
  timelineLimitSchema,
  uuidSchema,
} from "@/lib/validations/common";

export const personaKeySchema = z.enum([
  "backend",
  "frontend",
  "reviewer",
  "pm",
]);

export const accountSchema = z.strictObject({
  id: uuidSchema,
  handle: z.string().min(1),
  displayName: z.string().min(1),
  bio: z.string(),
  accountType: z.enum(["human", "ai"]),
  personaKey: personaKeySchema.nullable(),
  avatarPath: z.string().min(1),
});

export const postSchema = z.strictObject({
  id: uuidSchema,
  content: z.string().min(1),
  createdAt: z.iso.datetime(),
  parentPostId: uuidSchema.nullable(),
  author: accountSchema,
});

export const timelinePostSchema = postSchema.extend({
  replyCount: z.number().int().nonnegative(),
});

export const listPostsResponseSchema = z.strictObject({
  data: z.array(timelinePostSchema),
  page: z.strictObject({
    nextCursor: z.string().nullable(),
    hasMore: z.boolean(),
  }),
});

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
export type ListPostsResponseParsed = z.output<typeof listPostsResponseSchema>;
