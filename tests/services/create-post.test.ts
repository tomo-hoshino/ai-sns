import { describe, expect, it, vi } from "vitest";

import { RepositoryError } from "@/lib/repositories/errors";
import type { InsertRootPostInput } from "@/lib/repositories/post-repository";
import {
  createPost,
  type CreatePostDeps,
  type GenerateAiReplies,
} from "@/lib/services/create-post";
import { CreatePostError } from "@/lib/services/errors";
import type { Account } from "@/types/account";
import type { Post } from "@/types/post";

const humanAccount: Account = {
  id: "00000000-0000-4000-8000-000000000001",
  handle: "you",
  displayName: "あなた",
  bio: "AI社員と一緒に働く人",
  accountType: "human",
  personaKey: null,
  avatarPath: "/avatars/you.png",
};

const backendAi: Account = {
  id: "00000000-0000-4000-8000-000000000101",
  handle: "backend-ai",
  displayName: "Backend AI「バッキー」",
  bio: "API・DB・セキュリティ担当",
  accountType: "ai",
  personaKey: "backend",
  avatarPath: "/avatars/backend-ai.png",
};

const reviewerAi: Account = {
  id: "00000000-0000-4000-8000-000000000103",
  handle: "reviewer-ai",
  displayName: "Reviewer AI「レビ丸」",
  bio: "品質・リスク・レビュー担当",
  accountType: "ai",
  personaKey: "reviewer",
  avatarPath: "/avatars/reviewer-ai.png",
};

function makeRootPost(overrides?: Partial<Post>): Post {
  return {
    id: "a4e87a1b-989e-46e7-baa2-57d170f86afe",
    content: "投稿本文です",
    createdAt: "2026-07-18T04:10:30.000Z",
    parentPostId: null,
    author: humanAccount,
    ...overrides,
  };
}

function createDeps(overrides: Partial<CreatePostDeps> = {}): {
  deps: CreatePostDeps;
  findFixedHumanAccount: ReturnType<typeof vi.fn>;
  findAiAccounts: ReturnType<typeof vi.fn>;
  insertRootPost: ReturnType<typeof vi.fn>;
} {
  const findFixedHumanAccount =
    overrides.findFixedHumanAccount !== undefined
      ? vi.fn(overrides.findFixedHumanAccount)
      : vi.fn(async () => humanAccount);
  const findAiAccounts =
    overrides.findAiAccounts !== undefined
      ? vi.fn(overrides.findAiAccounts)
      : vi.fn(async () => [backendAi, reviewerAi]);
  const insertRootPost =
    overrides.insertRootPost !== undefined
      ? vi.fn(overrides.insertRootPost)
      : vi.fn(async (input: InsertRootPostInput) =>
          makeRootPost({ content: input.content }),
        );

  const deps: CreatePostDeps = {
    findFixedHumanAccount,
    findAiAccounts,
    insertRootPost,
    generateAiReplies: overrides.generateAiReplies,
  };

  return { deps, findFixedHumanAccount, findAiAccounts, insertRootPost };
}

describe("createPost", () => {
  it("saves a human root post with parentPostId null", async () => {
    const { deps, insertRootPost } = createDeps();

    const result = await createPost({ content: "  こんにちは  " }, deps);

    expect(insertRootPost).toHaveBeenCalledWith({
      authorId: humanAccount.id,
      content: "こんにちは",
    });
    expect(result.post.parentPostId).toBeNull();
    expect(result.post.content).toBe("こんにちは");
    expect(result.aiReplyStatus).toBe("not_requested");
    expect(result.mentionedAiHandles).toEqual([]);
    expect(result.aiReplies).toEqual([]);
    expect(result.succeededAiHandles).toEqual([]);
    expect(result.failedAi).toEqual([]);
  });

  it("returns valid AI mention handles without generating replies", async () => {
    const { deps } = createDeps();
    const content = "@backend-ai @reviewer-ai 設計を確認して！";

    const result = await createPost({ content }, deps);

    expect(result.post.parentPostId).toBeNull();
    expect(result.mentionedAiHandles).toEqual(["backend-ai", "reviewer-ai"]);
    expect(result.aiReplies).toEqual([]);
    expect(result.succeededAiHandles).toEqual([]);
    expect(result.failedAi).toEqual([]);
    expect(deps.generateAiReplies).toBeUndefined();
  });

  it("throws CreatePostError when the fixed human account is missing", async () => {
    const { deps, insertRootPost } = createDeps({
      findFixedHumanAccount: async () => null,
    });

    const error = await createPost({ content: "投稿" }, deps).catch(
      (caught: unknown) => caught,
    );

    expect(error).toBeInstanceOf(CreatePostError);
    expect(error).toMatchObject({ code: "FIXED_HUMAN_NOT_FOUND" });
    expect(insertRootPost).not.toHaveBeenCalled();
  });

  it("throws CreatePostError when root post save fails", async () => {
    const { deps } = createDeps({
      insertRootPost: async () => {
        throw new RepositoryError("Failed to insert root post");
      },
    });

    const error = await createPost({ content: "投稿" }, deps).catch(
      (caught: unknown) => caught,
    );

    expect(error).toBeInstanceOf(CreatePostError);
    expect(error).toMatchObject({ code: "POST_SAVE_FAILED" });
    expect((error as CreatePostError).cause).toBeInstanceOf(RepositoryError);
  });

  it("uses an injected generateAiReplies dependency when mentions exist", async () => {
    const aiReply = makeRootPost({
      id: "71fcb253-af1e-4a80-847a-f3518bc78bf1",
      content: "結論から言うと、入力検証を先に固めましょう。",
      parentPostId: "a4e87a1b-989e-46e7-baa2-57d170f86afe",
      author: backendAi,
    });
    const generateAiReplies = vi.fn<GenerateAiReplies>(async () => ({
      aiReplies: [aiReply],
      succeededAiHandles: ["backend-ai"],
      failedAi: [],
    }));
    const { deps } = createDeps({ generateAiReplies });

    const result = await createPost(
      { content: "@backend-ai 設計を確認して！" },
      deps,
    );

    expect(generateAiReplies).toHaveBeenCalledTimes(1);
    expect(generateAiReplies).toHaveBeenCalledWith({
      rootPost: expect.objectContaining({
        parentPostId: null,
        content: "@backend-ai 設計を確認して！",
      }),
      mentionedAiAccounts: [backendAi],
    });
    expect(result.aiReplyStatus).toBe("completed");
    expect(result.aiReplies).toEqual([aiReply]);
    expect(result.mentionedAiHandles).toEqual(["backend-ai"]);
    expect(result.succeededAiHandles).toEqual(["backend-ai"]);
    expect(result.failedAi).toEqual([]);
  });

  it("does not call OpenAI or a real database from unit tests", async () => {
    const { deps, findFixedHumanAccount, findAiAccounts, insertRootPost } =
      createDeps();

    await createPost({ content: "@backend-ai hello" }, deps);

    expect(findFixedHumanAccount).toHaveBeenCalledTimes(1);
    expect(findAiAccounts).toHaveBeenCalledTimes(1);
    expect(insertRootPost).toHaveBeenCalledTimes(1);
  });
});
