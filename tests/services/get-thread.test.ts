import { describe, expect, it, vi } from "vitest";

import { getThread } from "@/lib/services/get-thread";
import type { Post } from "@/types/post";

const humanAuthor = {
  id: "00000000-0000-4000-8000-000000000001",
  handle: "you",
  displayName: "あなた",
  bio: "AI社員と一緒に働く人",
  accountType: "human" as const,
  personaKey: null,
  avatarPath: "/avatars/you.png",
};

const aiAuthor = {
  id: "00000000-0000-4000-8000-000000000101",
  handle: "backend-ai",
  displayName: "Backend AI「バッキー」",
  bio: "API・DB・セキュリティ担当",
  accountType: "ai" as const,
  personaKey: "backend" as const,
  avatarPath: "/avatars/backend-ai.png",
};

const rootPostId = "a4e87a1b-989e-46e7-baa2-57d170f86afe";

function makeRootPost(overrides?: Partial<Post>): Post {
  return {
    id: rootPostId,
    content: "@backend-ai 投稿APIの設計を確認して！",
    createdAt: "2026-07-18T04:10:30.000Z",
    parentPostId: null,
    author: humanAuthor,
    ...overrides,
  };
}

function makeReplyPost(overrides?: Partial<Post>): Post {
  return {
    id: "71fcb253-af1e-4a80-847a-f3518bc78bf1",
    content: "結論、入力検証とDB保存を先に固めましょう。",
    createdAt: "2026-07-18T04:10:32.000Z",
    parentPostId: rootPostId,
    author: aiAuthor,
    ...overrides,
  };
}

describe("getThread", () => {
  it("returns root and replies in repository order", async () => {
    const root = makeRootPost();
    const replies = [
      makeReplyPost({
        id: "71fcb253-af1e-4a80-847a-f3518bc78bf1",
        createdAt: "2026-07-18T04:10:32.000Z",
      }),
      makeReplyPost({
        id: "8a1b2c3d-4e5f-4789-abcd-ef0123456789",
        createdAt: "2026-07-18T04:10:35.000Z",
        content: "UI側は文字数とfocus管理を先に固めましょう。",
        author: {
          ...aiAuthor,
          id: "00000000-0000-4000-8000-000000000102",
          handle: "frontend-ai",
          displayName: "Frontend AI「フローネ」",
          personaKey: "frontend",
          avatarPath: "/avatars/frontend-ai.png",
        },
      }),
    ];
    const findThreadByRootId = vi.fn().mockResolvedValue({ root, replies });

    const result = await getThread({ rootPostId }, { findThreadByRootId });

    expect(findThreadByRootId).toHaveBeenCalledWith(rootPostId);
    expect(result).toEqual({
      data: { root, replies },
    });
    expect(result.data.root.parentPostId).toBeNull();
    expect(
      result.data.replies.every((reply) => reply.parentPostId === rootPostId),
    ).toBe(true);
  });

  it("returns an empty replies array when there are no replies", async () => {
    const root = makeRootPost();
    const findThreadByRootId = vi.fn().mockResolvedValue({
      root,
      replies: [],
    });

    const result = await getThread({ rootPostId }, { findThreadByRootId });

    expect(result).toEqual({
      data: {
        root,
        replies: [],
      },
    });
  });

  it("throws THREAD_NOT_FOUND when the repository returns null", async () => {
    const findThreadByRootId = vi.fn().mockResolvedValue(null);

    await expect(
      getThread({ rootPostId }, { findThreadByRootId }),
    ).rejects.toMatchObject({
      name: "GetThreadError",
      code: "THREAD_NOT_FOUND",
    });
    expect(findThreadByRootId).toHaveBeenCalledWith(rootPostId);
  });

  it("does not invent nested replies beyond the repository result", async () => {
    const root = makeRootPost();
    const findThreadByRootId = vi.fn().mockResolvedValue({
      root,
      replies: [makeReplyPost()],
    });

    const result = await getThread({ rootPostId }, { findThreadByRootId });

    expect(result.data.replies).toHaveLength(1);
    expect(
      result.data.replies.every((reply) => reply.parentPostId === root.id),
    ).toBe(true);
  });
});
