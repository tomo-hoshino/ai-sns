import { describe, expect, it } from "vitest";

import { RepositoryError } from "@/lib/repositories/errors";
import {
  mapPost,
  mapPostFromUnknown,
  mapTimelinePost,
  mapTimelinePostFromUnknown,
} from "@/lib/repositories/map-post";

const author = {
  id: "00000000-0000-4000-8000-000000000001",
  handle: "you",
  display_name: "あなた",
  bio: "AI社員と一緒に働く人",
  account_type: "human",
  persona_key: null,
  avatar_path: "/avatars/you.png",
};

const postRow = {
  id: "a4e87a1b-989e-46e7-baa2-57d170f86afe",
  content: "@backend-ai 確認して！",
  created_at: "2026-07-18T04:10:30.000Z",
  parent_post_id: null,
  author,
};

describe("mapPost", () => {
  it("maps snake_case post + author to domain Post", () => {
    expect(mapPost(postRow)).toEqual({
      id: postRow.id,
      content: "@backend-ai 確認して！",
      createdAt: "2026-07-18T04:10:30.000Z",
      parentPostId: null,
      author: {
        id: author.id,
        handle: "you",
        displayName: "あなた",
        bio: "AI社員と一緒に働く人",
        accountType: "human",
        personaKey: null,
        avatarPath: "/avatars/you.png",
      },
    });
  });

  it("preserves parentPostId for replies", () => {
    const reply = mapPost({
      ...postRow,
      id: "71fcb253-af1e-4a80-847a-f3518bc78bf1",
      parent_post_id: postRow.id,
    });
    expect(reply.parentPostId).toBe(postRow.id);
  });

  it("rejects unknown shapes", () => {
    expect(() => mapPostFromUnknown({ id: postRow.id })).toThrow(
      RepositoryError,
    );
  });
});

describe("mapTimelinePost", () => {
  it("includes replyCount from the PostgREST count embed", () => {
    expect(
      mapTimelinePost({
        ...postRow,
        replies: [{ count: 2 }],
      }),
    ).toMatchObject({
      id: postRow.id,
      replyCount: 2,
    });
  });

  it("rejects missing or invalid reply count embeds", () => {
    expect(() =>
      mapTimelinePostFromUnknown({ ...postRow, replies: [] }),
    ).toThrow(RepositoryError);
    expect(() =>
      mapTimelinePostFromUnknown({ ...postRow, replies: [{ count: -1 }] }),
    ).toThrow(RepositoryError);
    expect(() => mapTimelinePostFromUnknown(postRow)).toThrow(RepositoryError);
  });
});
