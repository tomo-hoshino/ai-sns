import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { GET } from "@/app/api/posts/route";
import { RepositoryError } from "@/lib/repositories/errors";
import {
  apiErrorResponseSchema,
  encodeTimelineCursor,
} from "@/lib/validations/common";
import { listPostsResponseSchema } from "@/lib/validations/post";
import type { ListPostsResponse } from "@/types/api";

const listTimelinePostsMock = vi.fn();

vi.mock("@/lib/services/list-timeline-posts", () => ({
  listTimelinePosts: (...args: unknown[]) => listTimelinePostsMock(...args),
}));

const sampleResponse: ListPostsResponse = {
  data: [
    {
      id: "a4e87a1b-989e-46e7-baa2-57d170f86afe",
      content: "@sendo-ai 投稿APIの設計を確認して！",
      createdAt: "2026-07-18T04:10:30.000Z",
      parentPostId: null,
      replyCount: 1,
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
  ],
  page: {
    nextCursor:
      "eyJjcmVhdGVkQXQiOiIyMDI2LTA3LTE4VDA0OjEwOjMwLjAwMFoiLCJpZCI6ImE0ZTg3YTFiLTk4OWUtNDZlNy1iYWEyLTU3ZDE3MGY4NmFmZSJ9",
    hasMore: true,
  },
};

function createRequest(query = ""): NextRequest {
  const url =
    query.length === 0
      ? "http://localhost:3000/api/posts"
      : `http://localhost:3000/api/posts?${query}`;
  return new NextRequest(url);
}

describe("GET /api/posts", () => {
  beforeEach(() => {
    listTimelinePostsMock.mockReset();
  });

  it("returns 200 with timeline data and Cache-Control: no-store", async () => {
    listTimelinePostsMock.mockResolvedValue(sampleResponse);

    const response = await GET(createRequest("limit=20"));
    const body: unknown = await response.json();

    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(listPostsResponseSchema.safeParse(body).success).toBe(true);
    expect(body).toEqual(sampleResponse);
    expect(listTimelinePostsMock).toHaveBeenCalledWith({
      limit: 20,
      cursor: undefined,
    });
    expect(
      sampleResponse.data.every((post) => post.parentPostId === null),
    ).toBe(true);
  });

  it("returns an empty page shape", async () => {
    listTimelinePostsMock.mockResolvedValue({
      data: [],
      page: { nextCursor: null, hasMore: false },
    });

    const response = await GET(createRequest());
    const body: unknown = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      data: [],
      page: { nextCursor: null, hasMore: false },
    });
  });

  it("returns 400 VALIDATION_ERROR for an invalid limit", async () => {
    const response = await GET(createRequest("limit=51"));
    const body: unknown = await response.json();

    expect(response.status).toBe(400);
    expect(listTimelinePostsMock).not.toHaveBeenCalled();
    expect(apiErrorResponseSchema.safeParse(body).success).toBe(true);
    expect(body).toMatchObject({
      error: {
        code: "VALIDATION_ERROR",
        message: "入力内容を確認してください。",
      },
    });
    expect(typeof (body as { requestId: string }).requestId).toBe("string");
  });

  it("returns 400 VALIDATION_ERROR for an invalid cursor", async () => {
    const response = await GET(createRequest("cursor=broken-cursor"));
    const body: unknown = await response.json();

    expect(response.status).toBe(400);
    expect(listTimelinePostsMock).not.toHaveBeenCalled();
    expect(body).toMatchObject({
      error: { code: "VALIDATION_ERROR" },
    });
  });

  it("passes a valid opaque cursor to the service", async () => {
    const cursor = {
      createdAt: "2026-07-18T03:00:00.000Z",
      id: "6c2671cd-15f2-464e-bdd7-46c0de4ae342",
    };
    listTimelinePostsMock.mockResolvedValue({
      data: [],
      page: { nextCursor: null, hasMore: false },
    });

    const response = await GET(
      createRequest(`cursor=${encodeTimelineCursor(cursor)}`),
    );

    expect(response.status).toBe(200);
    expect(listTimelinePostsMock).toHaveBeenCalledWith({
      limit: 20,
      cursor,
    });
  });

  it("returns 500 DATABASE_ERROR when the repository fails", async () => {
    listTimelinePostsMock.mockRejectedValue(
      new RepositoryError("Failed to load timeline page"),
    );

    const response = await GET(createRequest());
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
    expect(JSON.stringify(body)).not.toContain("Failed to load timeline page");
  });
});
