import { describe, expect, it, vi } from "vitest";

import { ReplyGenerationError } from "@/lib/ai/generate-reply";
import { RepositoryError } from "@/lib/repositories/errors";
import type {
  InsertAiReplyInput,
  InsertRootPostInput,
} from "@/lib/repositories/post-repository";
import {
  createPost,
  generateAiReplies,
  type CreatePostDeps,
  type GenerateAiReplies,
  type GenerateAiRepliesDeps,
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
  handle: "sendo-ai",
  displayName: "メンターAI「センドウ」",
  bio: "API・DB・設計の相談役。聞かれたら丁寧に教える",
  accountType: "ai",
  personaKey: "backend",
  avatarPath: "/avatars/sendo-ai.png",
};

const reviewerAi: Account = {
  id: "00000000-0000-4000-8000-000000000103",
  handle: "hiyori-ai",
  displayName: "ひよっこAI「ヒヨリ」",
  bio: "品質を真面目に気にする新人。純粋な指摘が思わぬ急所を突くこともある",
  accountType: "ai",
  personaKey: "reviewer",
  avatarPath: "/avatars/hiyori-ai.png",
};

const frontendAi: Account = {
  id: "00000000-0000-4000-8000-000000000102",
  handle: "sora-ai",
  displayName: "Frontend AI「フロン」",
  bio: "UI・UX担当",
  accountType: "ai",
  personaKey: "frontend",
  avatarPath: "/avatars/sora-ai.png",
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

function makeAiReply(author: Account, content: string, id: string): Post {
  return {
    id,
    content,
    createdAt: "2026-07-18T04:10:32.000Z",
    parentPostId: "a4e87a1b-989e-46e7-baa2-57d170f86afe",
    author,
  };
}

function createDeps(overrides: Partial<CreatePostDeps> = {}): {
  deps: CreatePostDeps;
  findFixedHumanAccount: ReturnType<typeof vi.fn>;
  findAiAccounts: ReturnType<typeof vi.fn>;
  insertRootPost: ReturnType<typeof vi.fn>;
  generateAiReplies: ReturnType<typeof vi.fn>;
} {
  const findFixedHumanAccount =
    overrides.findFixedHumanAccount !== undefined
      ? vi.fn(overrides.findFixedHumanAccount)
      : vi.fn(async () => humanAccount);
  const findAiAccounts =
    overrides.findAiAccounts !== undefined
      ? vi.fn(overrides.findAiAccounts)
      : vi.fn(async () => [backendAi, reviewerAi, frontendAi]);
  const insertRootPost =
    overrides.insertRootPost !== undefined
      ? vi.fn(overrides.insertRootPost)
      : vi.fn(async (input: InsertRootPostInput) =>
          makeRootPost({ content: input.content }),
        );
  const generateAiRepliesFn =
    overrides.generateAiReplies !== undefined
      ? vi.fn(overrides.generateAiReplies)
      : vi.fn<GenerateAiReplies>(async () => ({
          aiReplies: [],
          succeededAiHandles: [],
          failedAi: [],
        }));

  const deps: CreatePostDeps = {
    findFixedHumanAccount,
    findAiAccounts,
    insertRootPost,
    generateAiReplies: generateAiRepliesFn,
  };

  return {
    deps,
    findFixedHumanAccount,
    findAiAccounts,
    insertRootPost,
    generateAiReplies: generateAiRepliesFn,
  };
}

function createGenerateDeps(
  overrides: Partial<GenerateAiRepliesDeps> = {},
): GenerateAiRepliesDeps & {
  generateReply: ReturnType<typeof vi.fn>;
  insertAiReply: ReturnType<typeof vi.fn>;
  isAiRepliesEnabled: ReturnType<typeof vi.fn>;
} {
  const generateReply =
    overrides.generateReply !== undefined
      ? vi.fn(overrides.generateReply)
      : vi.fn(async () => "生成された返信です。");
  const insertAiReply =
    overrides.insertAiReply !== undefined
      ? vi.fn(overrides.insertAiReply)
      : vi.fn(async (input: InsertAiReplyInput) =>
          makeAiReply(
            input.authorId === backendAi.id ? backendAi : reviewerAi,
            input.content,
            `reply-${input.authorId}`,
          ),
        );
  const isAiRepliesEnabled =
    overrides.isAiRepliesEnabled !== undefined
      ? vi.fn(overrides.isAiRepliesEnabled)
      : vi.fn(() => true);

  return {
    generateReply,
    insertAiReply,
    isAiRepliesEnabled,
  };
}

describe("createPost", () => {
  it("saves a human root post with parentPostId null when mentions are 0", async () => {
    const {
      deps,
      insertRootPost,
      generateAiReplies: generateFn,
    } = createDeps();

    const result = await createPost({ content: "  こんにちは  " }, deps);

    expect(insertRootPost).toHaveBeenCalledWith({
      authorId: humanAccount.id,
      content: "こんにちは",
    });
    expect(generateFn).not.toHaveBeenCalled();
    expect(result.post.parentPostId).toBeNull();
    expect(result.post.content).toBe("こんにちは");
    expect(result.aiReplyStatus).toBe("not_requested");
    expect(result.mentionedAiHandles).toEqual([]);
    expect(result.aiReplies).toEqual([]);
    expect(result.succeededAiHandles).toEqual([]);
    expect(result.failedAi).toEqual([]);
  });

  it("generates one AI reply for a single valid mention", async () => {
    const aiReply = makeAiReply(
      backendAi,
      "結論から言うと、入力検証を先に固めましょう。",
      "71fcb253-af1e-4a80-847a-f3518bc78bf1",
    );
    const { deps, generateAiReplies: generateFn } = createDeps({
      generateAiReplies: async () => ({
        aiReplies: [aiReply],
        succeededAiHandles: ["sendo-ai"],
        failedAi: [],
      }),
    });

    const result = await createPost(
      { content: "@sendo-ai 設計を確認して！" },
      deps,
    );

    expect(generateFn).toHaveBeenCalledTimes(1);
    expect(generateFn).toHaveBeenCalledWith({
      rootPost: expect.objectContaining({
        parentPostId: null,
        content: "@sendo-ai 設計を確認して！",
      }),
      mentionedAiAccounts: [backendAi],
    });
    expect(result.aiReplyStatus).toBe("completed");
    expect(result.aiReplies).toEqual([aiReply]);
    expect(result.mentionedAiHandles).toEqual(["sendo-ai"]);
    expect(result.succeededAiHandles).toEqual(["sendo-ai"]);
    expect(result.failedAi).toEqual([]);
  });

  it("generates replies for multiple distinct AI mentions", async () => {
    const backendReply = makeAiReply(
      backendAi,
      "backend reply",
      "71fcb253-af1e-4a80-847a-f3518bc78bf1",
    );
    const reviewerReply = makeAiReply(
      reviewerAi,
      "reviewer reply",
      "96fda302-c7d1-408d-8899-a8d67ac58fe0",
    );
    const { deps } = createDeps({
      generateAiReplies: async () => ({
        aiReplies: [backendReply, reviewerReply],
        succeededAiHandles: ["sendo-ai", "hiyori-ai"],
        failedAi: [],
      }),
    });

    const result = await createPost(
      { content: "@sendo-ai @hiyori-ai 設計を確認して！" },
      deps,
    );

    expect(result.aiReplyStatus).toBe("completed");
    expect(result.mentionedAiHandles).toEqual(["sendo-ai", "hiyori-ai"]);
    expect(result.succeededAiHandles).toEqual(["sendo-ai", "hiyori-ai"]);
    expect(result.aiReplies).toHaveLength(2);
    expect(result.failedAi).toEqual([]);
  });

  it("deduplicates repeated AI mentions before generation", async () => {
    const { deps, generateAiReplies: generateFn } = createDeps({
      generateAiReplies: async () => ({
        aiReplies: [
          makeAiReply(
            backendAi,
            "one reply",
            "71fcb253-af1e-4a80-847a-f3518bc78bf1",
          ),
        ],
        succeededAiHandles: ["sendo-ai"],
        failedAi: [],
      }),
    });

    const result = await createPost(
      { content: "@sendo-ai @Backend-AI @sendo-ai 確認して" },
      deps,
    );

    expect(generateFn).toHaveBeenCalledWith({
      rootPost: expect.anything(),
      mentionedAiAccounts: [backendAi],
    });
    expect(result.mentionedAiHandles).toEqual(["sendo-ai"]);
    expect(result.succeededAiHandles).toEqual(["sendo-ai"]);
  });

  it("keeps the human post and reports partial when some AI replies fail", async () => {
    const backendReply = makeAiReply(
      backendAi,
      "ok",
      "71fcb253-af1e-4a80-847a-f3518bc78bf1",
    );
    const { deps, insertRootPost } = createDeps({
      generateAiReplies: async () => ({
        aiReplies: [backendReply],
        succeededAiHandles: ["sendo-ai"],
        failedAi: [{ handle: "hiyori-ai", code: "GENERATION_FAILED" }],
      }),
    });

    const result = await createPost(
      { content: "@sendo-ai @hiyori-ai 確認して" },
      deps,
    );

    expect(insertRootPost).toHaveBeenCalledTimes(1);
    expect(result.post.parentPostId).toBeNull();
    expect(result.aiReplyStatus).toBe("partial");
    expect(result.succeededAiHandles).toEqual(["sendo-ai"]);
    expect(result.failedAi).toEqual([
      { handle: "hiyori-ai", code: "GENERATION_FAILED" },
    ]);
    expect(result.aiReplies).toEqual([backendReply]);
  });

  it("keeps the human post when every AI reply fails", async () => {
    const { deps, insertRootPost } = createDeps({
      generateAiReplies: async () => ({
        aiReplies: [],
        succeededAiHandles: [],
        failedAi: [
          { handle: "sendo-ai", code: "GENERATION_FAILED" },
          { handle: "hiyori-ai", code: "REPLY_SAVE_FAILED" },
        ],
      }),
    });

    const result = await createPost(
      { content: "@sendo-ai @hiyori-ai 確認して" },
      deps,
    );

    expect(insertRootPost).toHaveBeenCalledTimes(1);
    expect(result.post.parentPostId).toBeNull();
    expect(result.aiReplyStatus).toBe("failed");
    expect(result.aiReplies).toEqual([]);
    expect(result.succeededAiHandles).toEqual([]);
    expect(result.failedAi).toEqual([
      { handle: "sendo-ai", code: "GENERATION_FAILED" },
      { handle: "hiyori-ai", code: "REPLY_SAVE_FAILED" },
    ]);
  });

  it("returns disabled without deleting the human post", async () => {
    const { deps, insertRootPost } = createDeps({
      generateAiReplies: async () => ({
        aiReplies: [],
        succeededAiHandles: [],
        failedAi: [],
        disabled: true,
      }),
    });

    const result = await createPost({ content: "@sendo-ai 確認して" }, deps);

    expect(insertRootPost).toHaveBeenCalledTimes(1);
    expect(result.aiReplyStatus).toBe("disabled");
    expect(result.mentionedAiHandles).toEqual(["sendo-ai"]);
    expect(result.aiReplies).toEqual([]);
    expect(result.succeededAiHandles).toEqual([]);
    expect(result.failedAi).toEqual([]);
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

  it("does not call OpenAI or a real database from unit tests", async () => {
    const { deps, findFixedHumanAccount, findAiAccounts, insertRootPost } =
      createDeps();

    await createPost({ content: "@sendo-ai hello" }, deps);

    expect(findFixedHumanAccount).toHaveBeenCalledTimes(1);
    expect(findAiAccounts).toHaveBeenCalledTimes(1);
    expect(insertRootPost).toHaveBeenCalledTimes(1);
  });

  it("wires real generateAiReplies for a single mention end-to-end", async () => {
    const generateDeps = createGenerateDeps({
      generateReply: async () => "統合された返信です。",
      insertAiReply: async (input) =>
        makeAiReply(backendAi, input.content, "e2e-reply-id"),
    });
    const { deps, insertRootPost } = createDeps({
      generateAiReplies: (input) => generateAiReplies(input, generateDeps),
    });

    const result = await createPost({ content: "@sendo-ai 確認して" }, deps);

    expect(insertRootPost).toHaveBeenCalledTimes(1);
    expect(generateDeps.generateReply).toHaveBeenCalledTimes(1);
    expect(generateDeps.insertAiReply).toHaveBeenCalledTimes(1);
    expect(result.aiReplyStatus).toBe("completed");
    expect(result.succeededAiHandles).toEqual(["sendo-ai"]);
    expect(result.aiReplies).toHaveLength(1);
  });
});

describe("generateAiReplies", () => {
  const rootPost = makeRootPost({
    content: "@sendo-ai @hiyori-ai 設計を確認して！",
  });

  it("skips OpenAI and reply saves when AI replies are disabled", async () => {
    const deps = createGenerateDeps({
      isAiRepliesEnabled: () => false,
    });

    const result = await generateAiReplies(
      {
        rootPost,
        mentionedAiAccounts: [backendAi, reviewerAi],
      },
      deps,
    );

    expect(deps.generateReply).not.toHaveBeenCalled();
    expect(deps.insertAiReply).not.toHaveBeenCalled();
    expect(result).toEqual({
      aiReplies: [],
      succeededAiHandles: [],
      failedAi: [],
      disabled: true,
    });
  });

  it("generates and saves one reply per mentioned AI", async () => {
    const deps = createGenerateDeps({
      generateReply: async ({ personaKey }) => `reply-for-${personaKey}`,
      insertAiReply: async (input) =>
        makeAiReply(
          input.authorId === backendAi.id ? backendAi : reviewerAi,
          input.content,
          `saved-${input.authorId}`,
        ),
    });

    const result = await generateAiReplies(
      {
        rootPost,
        mentionedAiAccounts: [backendAi, reviewerAi],
      },
      deps,
    );

    expect(deps.generateReply).toHaveBeenCalledTimes(2);
    expect(deps.insertAiReply).toHaveBeenCalledTimes(2);
    expect(deps.generateReply).toHaveBeenCalledWith({
      personaKey: "backend",
      rootPost: {
        content: rootPost.content,
        author: { handle: "you" },
      },
      existingReplies: [],
    });
    expect(result.succeededAiHandles).toEqual(["sendo-ai", "hiyori-ai"]);
    expect(result.failedAi).toEqual([]);
    expect(result.aiReplies).toHaveLength(2);
    expect(result.disabled).toBeUndefined();
  });

  it("isolates generation failures from successful siblings", async () => {
    const deps = createGenerateDeps({
      generateReply: async ({ personaKey }) => {
        if (personaKey === "reviewer") {
          throw new ReplyGenerationError("empty");
        }
        return "backend ok";
      },
      insertAiReply: async (input) =>
        makeAiReply(backendAi, input.content, "saved-backend"),
    });

    const result = await generateAiReplies(
      {
        rootPost,
        mentionedAiAccounts: [backendAi, reviewerAi],
      },
      deps,
    );

    expect(result.succeededAiHandles).toEqual(["sendo-ai"]);
    expect(result.failedAi).toEqual([
      { handle: "hiyori-ai", code: "GENERATION_FAILED" },
    ]);
    expect(result.aiReplies).toHaveLength(1);
  });

  it("maps reply save failures to REPLY_SAVE_FAILED", async () => {
    const deps = createGenerateDeps({
      generateReply: async () => "generated text",
      insertAiReply: async () => {
        throw new RepositoryError("Failed to insert AI reply");
      },
    });

    const result = await generateAiReplies(
      {
        rootPost,
        mentionedAiAccounts: [backendAi],
      },
      deps,
    );

    expect(result.succeededAiHandles).toEqual([]);
    expect(result.failedAi).toEqual([
      { handle: "sendo-ai", code: "REPLY_SAVE_FAILED" },
    ]);
    expect(result.aiReplies).toEqual([]);
  });

  it("treats missing personaKey as GENERATION_FAILED", async () => {
    const brokenAi: Account = { ...backendAi, personaKey: null };
    const deps = createGenerateDeps();

    const result = await generateAiReplies(
      {
        rootPost,
        mentionedAiAccounts: [brokenAi],
      },
      deps,
    );

    expect(deps.generateReply).not.toHaveBeenCalled();
    expect(deps.insertAiReply).not.toHaveBeenCalled();
    expect(result.failedAi).toEqual([
      { handle: "sendo-ai", code: "GENERATION_FAILED" },
    ]);
  });

  it("does not re-parse AI reply content for further mentions", async () => {
    const deps = createGenerateDeps({
      generateReply: async () =>
        "@sora-ai も呼んでください。次のAIを起動します。",
      insertAiReply: async (input) =>
        makeAiReply(backendAi, input.content, "saved-backend"),
    });

    const result = await generateAiReplies(
      {
        rootPost,
        mentionedAiAccounts: [backendAi],
      },
      deps,
    );

    expect(deps.generateReply).toHaveBeenCalledTimes(1);
    expect(deps.insertAiReply).toHaveBeenCalledTimes(1);
    expect(result.succeededAiHandles).toEqual(["sendo-ai"]);
    expect(result.aiReplies[0]?.content).toContain("@sora-ai");
  });
});
