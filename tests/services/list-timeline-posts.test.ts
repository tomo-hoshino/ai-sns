import { describe, expect, it, vi } from "vitest";

import { encodeTimelineCursor } from "@/lib/validations/common";
import { listTimelinePosts } from "@/lib/services/list-timeline-posts";
import type { TimelinePost } from "@/types/post";

const author = {
  id: "00000000-0000-4000-8000-000000000001",
  handle: "you",
  displayName: "あなた",
  bio: "AI社員と一緒に働く人",
  accountType: "human" as const,
  personaKey: null,
  avatarPath: "/avatars/you.png",
};

function makeRootPost(
  overrides: Partial<TimelinePost> & Pick<TimelinePost, "id" | "createdAt">,
): TimelinePost {
  return {
    content: "ルート投稿です",
    parentPostId: null,
    replyCount: 0,
    author,
    ...overrides,
  };
}

describe("listTimelinePosts", () => {
  it("returns posts with nextCursor when hasMore is true", async () => {
    const posts = [
      makeRootPost({
        id: "a4e87a1b-989e-46e7-baa2-57d170f86afe",
        createdAt: "2026-07-18T04:10:30.000Z",
        replyCount: 1,
        content: "@sendo-ai 投稿APIの設計を確認して！",
      }),
      makeRootPost({
        id: "6c2671cd-15f2-464e-bdd7-46c0de4ae342",
        createdAt: "2026-07-18T03:00:00.000Z",
      }),
    ];
    const findTimelinePage = vi.fn().mockResolvedValue({
      posts,
      hasMore: true,
    });

    const result = await listTimelinePosts({ limit: 2 }, { findTimelinePage });

    expect(findTimelinePage).toHaveBeenCalledWith({
      limit: 2,
      cursor: undefined,
    });
    expect(result.data).toEqual(posts);
    expect(result.page.hasMore).toBe(true);
    expect(result.page.nextCursor).toBe(
      encodeTimelineCursor({
        createdAt: posts[1].createdAt,
        id: posts[1].id,
      }),
    );
    expect(result.data.every((post) => post.parentPostId === null)).toBe(true);
  });

  it("returns an empty page without a next cursor", async () => {
    const findTimelinePage = vi.fn().mockResolvedValue({
      posts: [],
      hasMore: false,
    });

    const result = await listTimelinePosts({ limit: 20 }, { findTimelinePage });

    expect(result).toEqual({
      data: [],
      page: {
        nextCursor: null,
        hasMore: false,
      },
    });
  });

  it("passes a decoded cursor through to the repository", async () => {
    const cursor = {
      createdAt: "2026-07-18T03:00:00.000Z",
      id: "6c2671cd-15f2-464e-bdd7-46c0de4ae342",
    };
    const findTimelinePage = vi.fn().mockResolvedValue({
      posts: [
        makeRootPost({
          id: "71fcb253-af1e-4a80-847a-f3518bc78bf1",
          createdAt: "2026-07-18T02:00:00.000Z",
        }),
      ],
      hasMore: false,
    });

    const result = await listTimelinePosts(
      { limit: 20, cursor },
      { findTimelinePage },
    );

    expect(findTimelinePage).toHaveBeenCalledWith({
      limit: 20,
      cursor,
    });
    expect(result.page.nextCursor).toBeNull();
    expect(result.page.hasMore).toBe(false);
  });
});
