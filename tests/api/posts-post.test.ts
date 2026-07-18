import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { POST } from "@/app/api/posts/route";
import type { CreatePostResult } from "@/lib/services/create-post";
import { CreatePostError } from "@/lib/services/errors";
import {
  apiErrorResponseSchema,
  countUnicodeCodePoints,
} from "@/lib/validations/common";
import { createPostResponseSchema } from "@/lib/validations/post";
import type { Account } from "@/types/account";
import type { CreatePostResponse } from "@/types/api";
import type { Post } from "@/types/post";

const createPostMock = vi.fn();

vi.mock("@/lib/services/create-post", () => ({
  createPost: (...args: unknown[]) => createPostMock(...args),
}));

const humanAuthor: Account = {
  id: "00000000-0000-4000-8000-000000000001",
  handle: "you",
  displayName: "あなた",
  bio: "AI社員と一緒に働く人",
  accountType: "human",
  personaKey: null,
  avatarPath: "/avatars/you.png",
};

const rootPost: Post = {
  id: "a4e87a1b-989e-46e7-baa2-57d170f86afe",
  content: "今日の進捗を共有します",
  createdAt: "2026-07-18T04:10:30.000Z",
  parentPostId: null,
  author: humanAuthor,
};

const successResult: CreatePostResult = {
  post: rootPost,
  aiReplies: [],
  aiReplyStatus: "not_requested",
  mentionedAiHandles: [],
  succeededAiHandles: [],
  failedAi: [],
};

function createPostRequest(
  body: unknown,
  init?: { contentType?: string | null; rawBody?: string },
): NextRequest {
  const headers = new Headers();
  if (init?.contentType !== null) {
    headers.set("Content-Type", init?.contentType ?? "application/json");
  }

  return new NextRequest("http://localhost:3000/api/posts", {
    method: "POST",
    headers,
    body: init?.rawBody ?? JSON.stringify(body),
  });
}

describe("POST /api/posts", () => {
  beforeEach(() => {
    createPostMock.mockReset();
  });

  it("returns 201 with aiReplyStatus not_requested when there are no mentions", async () => {
    createPostMock.mockResolvedValue(successResult);

    const response = await POST(
      createPostRequest({ content: "今日の進捗を共有します" }),
    );
    const body: unknown = await response.json();

    expect(response.status).toBe(201);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(createPostResponseSchema.safeParse(body).success).toBe(true);
    expect(createPostMock).toHaveBeenCalledWith({
      content: "今日の進捗を共有します",
    });

    const typed = body as CreatePostResponse;
    expect(typed.data.post.parentPostId).toBeNull();
    expect(typed.data.aiReplies).toEqual([]);
    expect(typed.meta).toEqual({
      aiReplyStatus: "not_requested",
      mentionedAiHandles: [],
      succeededAiHandles: [],
      failedAi: [],
    });
    expect(typeof typed.requestId).toBe("string");
  });

  it("returns 400 VALIDATION_ERROR for empty content", async () => {
    const response = await POST(createPostRequest({ content: "   " }));
    const body: unknown = await response.json();

    expect(response.status).toBe(400);
    expect(createPostMock).not.toHaveBeenCalled();
    expect(apiErrorResponseSchema.safeParse(body).success).toBe(true);
    expect(body).toMatchObject({
      error: {
        code: "VALIDATION_ERROR",
        message: "入力内容を確認してください。",
      },
    });
    expect(typeof (body as { requestId: string }).requestId).toBe("string");
  });

  it("returns 400 VALIDATION_ERROR for 301 characters", async () => {
    const content = "あ".repeat(301);
    expect(countUnicodeCodePoints(content)).toBe(301);

    const response = await POST(createPostRequest({ content }));
    const body: unknown = await response.json();

    expect(response.status).toBe(400);
    expect(createPostMock).not.toHaveBeenCalled();
    expect(body).toMatchObject({
      error: { code: "VALIDATION_ERROR" },
    });
  });

  it("returns 400 VALIDATION_ERROR for unknown fields", async () => {
    const response = await POST(
      createPostRequest({ content: "本文", extra: true }),
    );
    const body: unknown = await response.json();

    expect(response.status).toBe(400);
    expect(createPostMock).not.toHaveBeenCalled();
    expect(body).toMatchObject({
      error: { code: "VALIDATION_ERROR" },
    });
  });

  it("returns 400 VALIDATION_ERROR for broken JSON", async () => {
    const response = await POST(
      createPostRequest(null, { rawBody: "{not-json" }),
    );
    const body: unknown = await response.json();

    expect(response.status).toBe(400);
    expect(createPostMock).not.toHaveBeenCalled();
    expect(apiErrorResponseSchema.safeParse(body).success).toBe(true);
    expect(body).toMatchObject({
      error: {
        code: "VALIDATION_ERROR",
        details: [{ path: "(root)", message: "JSONの形式が不正です。" }],
      },
    });
  });

  it("returns 400 VALIDATION_ERROR when Content-Type is not JSON", async () => {
    const response = await POST(
      createPostRequest(
        { content: "本文" },
        { contentType: "text/plain", rawBody: '{"content":"本文"}' },
      ),
    );
    const body: unknown = await response.json();

    expect(response.status).toBe(400);
    expect(createPostMock).not.toHaveBeenCalled();
    expect(body).toMatchObject({
      error: {
        code: "VALIDATION_ERROR",
        details: [
          {
            path: "(root)",
            message: "Content-Typeはapplication/jsonである必要があります。",
          },
        ],
      },
    });
  });

  it("returns 500 DATABASE_ERROR without secrets when save fails", async () => {
    createPostMock.mockRejectedValue(
      new CreatePostError("POST_SAVE_FAILED", "Failed to save root post", {
        cause: new Error("connection string=secret"),
      }),
    );

    const response = await POST(createPostRequest({ content: "保存テスト" }));
    const body: unknown = await response.json();
    const serialized = JSON.stringify(body);

    expect(response.status).toBe(500);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(apiErrorResponseSchema.safeParse(body).success).toBe(true);
    expect(body).toMatchObject({
      error: {
        code: "DATABASE_ERROR",
        message: "投稿の保存に失敗しました。",
      },
    });
    expect(serialized).not.toContain("Failed to save root post");
    expect(serialized).not.toContain("connection string");
    expect(serialized).not.toContain("secret");
  });

  it("returns 500 INTERNAL_ERROR when the fixed human account is missing", async () => {
    createPostMock.mockRejectedValue(
      new CreatePostError(
        "FIXED_HUMAN_NOT_FOUND",
        "Fixed human account is missing",
      ),
    );

    const response = await POST(createPostRequest({ content: "設定不整合" }));
    const body: unknown = await response.json();

    expect(response.status).toBe(500);
    expect(body).toMatchObject({
      error: {
        code: "INTERNAL_ERROR",
        message: "サーバーでエラーが発生しました。",
      },
    });
    expect(JSON.stringify(body)).not.toContain("Fixed human account");
  });
});
