import { describe, expect, it, vi } from "vitest";

import { listProfilePosts } from "@/lib/services/list-profile-posts";
import type { TimelinePost } from "@/types/post";

const author = {
  id: "00000000-0000-4000-8000-000000000001",
  handle: "guest",
  displayName: "Guest",
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

describe("listProfilePosts", () => {
  it("returns root posts for the author", async () => {
    const posts = [
      makeRootPost({
        id: "a4e87a1b-989e-46e7-baa2-57d170f86afe",
        createdAt: "2026-07-18T04:10:30.000Z",
        replyCount: 2,
      }),
    ];
    const findRootPostsByAuthorId = vi.fn().mockResolvedValue({ posts });

    const result = await listProfilePosts(
      { authorId: author.id, limit: 20 },
      { findRootPostsByAuthorId },
    );

    expect(findRootPostsByAuthorId).toHaveBeenCalledWith({
      authorId: author.id,
      limit: 20,
    });
    expect(result.posts).toEqual(posts);
    expect(result.posts.every((post) => post.parentPostId === null)).toBe(true);
  });

  it("returns an empty list when the author has no root posts", async () => {
    const findRootPostsByAuthorId = vi.fn().mockResolvedValue({ posts: [] });

    const result = await listProfilePosts(
      { authorId: author.id, limit: 20 },
      { findRootPostsByAuthorId },
    );

    expect(result).toEqual({ posts: [] });
  });
});
