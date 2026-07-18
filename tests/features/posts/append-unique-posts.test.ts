import { describe, expect, it } from "vitest";

import { appendUniquePosts } from "@/features/posts/utils/append-unique-posts";
import type { Account } from "@/types/account";
import type { TimelinePost } from "@/types/post";

const author: Account = {
  id: "00000000-0000-4000-8000-000000000001",
  handle: "you",
  displayName: "あなた",
  bio: "AI社員と一緒に働く人",
  accountType: "human",
  personaKey: null,
  avatarPath: "/avatars/you.png",
};

function createPost(id: string, content: string): TimelinePost {
  return {
    id,
    content,
    createdAt: "2026-07-18T10:00:00.000Z",
    parentPostId: null,
    author,
    replyCount: 0,
  };
}

describe("appendUniquePosts", () => {
  it("appends new posts after existing ones", () => {
    const existing = [createPost("11111111-1111-4111-8111-111111111111", "a")];
    const incoming = [createPost("22222222-2222-4222-8222-222222222222", "b")];

    expect(appendUniquePosts(existing, incoming)).toEqual([
      existing[0],
      incoming[0],
    ]);
  });

  it("drops incoming posts that duplicate an existing id", () => {
    const existing = [createPost("11111111-1111-4111-8111-111111111111", "a")];
    const incoming = [
      createPost("11111111-1111-4111-8111-111111111111", "duplicate"),
      createPost("22222222-2222-4222-8222-222222222222", "b"),
    ];

    expect(appendUniquePosts(existing, incoming)).toEqual([
      existing[0],
      incoming[1],
    ]);
  });

  it("drops duplicate ids within the incoming page", () => {
    const existing: TimelinePost[] = [];
    const first = createPost("11111111-1111-4111-8111-111111111111", "a");
    const duplicate = createPost("11111111-1111-4111-8111-111111111111", "dup");

    expect(appendUniquePosts(existing, [first, duplicate])).toEqual([first]);
  });
});
