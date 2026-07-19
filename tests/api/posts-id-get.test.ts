import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { GET } from "@/app/api/posts/[id]/route";
import { RepositoryError } from "@/lib/repositories/errors";
import { GetThreadError } from "@/lib/services/errors";
import { apiErrorResponseSchema } from "@/lib/validations/common";
import { getThreadResponseSchema } from "@/lib/validations/post";
import type { GetThreadResponse } from "@/types/api";

const getThreadMock = vi.fn();

vi.mock("@/lib/services/get-thread", () => ({
  getThread: (...args: unknown[]) => getThreadMock(...args),
}));

const rootPostId = "a4e87a1b-989e-46e7-baa2-57d170f86afe";
const replyPostId = "71fcb253-af1e-4a80-847a-f3518bc78bf1";

const sampleResponse: GetThreadResponse = {
  data: {
    root: {
      id: rootPostId,
      content: "@sendo-ai 投稿APIの設計を確認して！",
      createdAt: "2026-07-18T04:10:30.000Z",
      parentPostId: null,
      author: {
        id: "00000000-0000-4000-8000-000000000001",
        handle: "you",
        displayName: "あなた",
        bio: "AI社員と一緒に働く人",
        accountType: "human",
        personaKey: null,
        avatarPath: "/avatars/you.png",
      },
    },
    replies: [
      {
        id: replyPostId,
        content:
          "結論、入力検証とDB保存を先に固めましょう。AI生成は投稿保存後に分離すれば、外部API障害でも元投稿を失いません。",
        createdAt: "2026-07-18T04:10:32.000Z",
        parentPostId: rootPostId,
        author: {
          id: "00000000-0000-4000-8000-000000000101",
          handle: "sendo-ai",
          displayName: "メンターAI「センドウ」",
          bio: "API・DB・設計の相談役。聞かれたら丁寧に教える",
          accountType: "ai",
          personaKey: "backend",
          avatarPath: "/avatars/sendo-ai.png",
        },
      },
    ],
  },
};

function createRequest(id: string): NextRequest {
  return new NextRequest(`http://localhost:3000/api/posts/${id}`);
}

function createContext(id: string) {
  return {
    params: Promise.resolve({ id }),
  };
}

describe("GET /api/posts/[id]", () => {
  beforeEach(() => {
    getThreadMock.mockReset();
  });

  it("returns 200 with root and replies and Cache-Control: no-store", async () => {
    getThreadMock.mockResolvedValue(sampleResponse);

    const response = await GET(
      createRequest(rootPostId),
      createContext(rootPostId),
    );
    const body: unknown = await response.json();

    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(getThreadResponseSchema.safeParse(body).success).toBe(true);
    expect(body).toEqual(sampleResponse);
    expect(getThreadMock).toHaveBeenCalledWith({ rootPostId });
  });

  it("returns 200 with an empty replies array", async () => {
    getThreadMock.mockResolvedValue({
      data: {
        root: sampleResponse.data.root,
        replies: [],
      },
    });

    const response = await GET(
      createRequest(rootPostId),
      createContext(rootPostId),
    );
    const body: unknown = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      data: {
        root: sampleResponse.data.root,
        replies: [],
      },
    });
  });

  it("returns 400 VALIDATION_ERROR for an invalid UUID", async () => {
    const response = await GET(
      createRequest("not-a-uuid"),
      createContext("not-a-uuid"),
    );
    const body: unknown = await response.json();

    expect(response.status).toBe(400);
    expect(getThreadMock).not.toHaveBeenCalled();
    expect(apiErrorResponseSchema.safeParse(body).success).toBe(true);
    expect(body).toMatchObject({
      error: {
        code: "VALIDATION_ERROR",
        message: "入力内容を確認してください。",
      },
    });
    expect(typeof (body as { requestId: string }).requestId).toBe("string");
  });

  it("returns 404 THREAD_NOT_FOUND when the root post is missing", async () => {
    getThreadMock.mockRejectedValue(
      new GetThreadError("THREAD_NOT_FOUND", "Thread root post was not found"),
    );

    const response = await GET(
      createRequest(rootPostId),
      createContext(rootPostId),
    );
    const body: unknown = await response.json();

    expect(response.status).toBe(404);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(apiErrorResponseSchema.safeParse(body).success).toBe(true);
    expect(body).toMatchObject({
      error: {
        code: "THREAD_NOT_FOUND",
        message: "指定されたスレッドが見つかりません。",
      },
    });
    expect(typeof (body as { requestId: string }).requestId).toBe("string");
  });

  it("returns 404 THREAD_NOT_FOUND when a reply ID is specified", async () => {
    getThreadMock.mockRejectedValue(
      new GetThreadError("THREAD_NOT_FOUND", "Thread root post was not found"),
    );

    const response = await GET(
      createRequest(replyPostId),
      createContext(replyPostId),
    );
    const body: unknown = await response.json();

    expect(response.status).toBe(404);
    expect(getThreadMock).toHaveBeenCalledWith({ rootPostId: replyPostId });
    expect(body).toMatchObject({
      error: {
        code: "THREAD_NOT_FOUND",
        message: "指定されたスレッドが見つかりません。",
      },
    });
  });

  it("returns 500 DATABASE_ERROR when the repository fails", async () => {
    getThreadMock.mockRejectedValue(
      new RepositoryError("Failed to load thread root"),
    );

    const response = await GET(
      createRequest(rootPostId),
      createContext(rootPostId),
    );
    const body: unknown = await response.json();

    expect(response.status).toBe(500);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(apiErrorResponseSchema.safeParse(body).success).toBe(true);
    expect(body).toMatchObject({
      error: {
        code: "DATABASE_ERROR",
        message: "データの取得に失敗しました。",
      },
    });
    expect(JSON.stringify(body)).not.toContain("Failed to load thread root");
  });
});
