import "server-only";

import {
  generateReply,
  type GenerateReplyInput,
} from "@/lib/ai/generate-reply";
import { extractMentionedAiAccounts } from "@/lib/ai/mentions";
import { getEnv } from "@/lib/env";
import { findAiAccounts } from "@/lib/repositories/account-repository";
import { RepositoryError } from "@/lib/repositories/errors";
import {
  insertAiReply,
  insertRootPost,
  type InsertAiReplyInput,
  type InsertRootPostInput,
} from "@/lib/repositories/post-repository";
import { CreatePostError } from "@/lib/services/errors";
import type { Account } from "@/types/account";
import type { AiReplyStatus, FailedAi, FailedAiCode } from "@/types/api";
import type { Post } from "@/types/post";

export type CreatePostInput = {
  /** Trimmed post body (1–300 Unicode code points). Validated at the API boundary. */
  content: string;
  /**
   * Human author resolved by the Route Handler: session profile when logged in,
   * shared Guest (`@guest`) when not. Never taken from the request body.
   */
  author: Account;
};

export type GenerateAiRepliesInput = {
  rootPost: Post;
  mentionedAiAccounts: readonly Account[];
};

export type GenerateAiRepliesResult = {
  aiReplies: Post[];
  succeededAiHandles: string[];
  failedAi: FailedAi[];
  /** When true, generation was skipped because AI replies are disabled. */
  disabled?: boolean;
};

export type GenerateAiReplies = (
  input: GenerateAiRepliesInput,
) => Promise<GenerateAiRepliesResult>;

export type GenerateAiRepliesDeps = {
  isAiRepliesEnabled: () => boolean;
  generateReply: (input: GenerateReplyInput) => Promise<string>;
  insertAiReply: (input: InsertAiReplyInput) => Promise<Post>;
};

export type CreatePostDeps = {
  findAiAccounts: () => Promise<Account[]>;
  insertRootPost: (input: InsertRootPostInput) => Promise<Post>;
  generateAiReplies: GenerateAiReplies;
};

export type CreatePostResult = {
  post: Post;
  aiReplies: Post[];
  aiReplyStatus: AiReplyStatus;
  mentionedAiHandles: string[];
  succeededAiHandles: string[];
  failedAi: FailedAi[];
};

const defaultGenerateAiRepliesDeps: GenerateAiRepliesDeps = {
  isAiRepliesEnabled: () => getEnv().AI_REPLIES_ENABLED,
  generateReply,
  insertAiReply,
};

/**
 * Generate and persist one reply per mentioned AI.
 * Failures are isolated; AI reply content is never re-parsed for mentions.
 */
export async function generateAiReplies(
  input: GenerateAiRepliesInput,
  deps: GenerateAiRepliesDeps = defaultGenerateAiRepliesDeps,
): Promise<GenerateAiRepliesResult> {
  if (!deps.isAiRepliesEnabled()) {
    return {
      aiReplies: [],
      succeededAiHandles: [],
      failedAi: [],
      disabled: true,
    };
  }

  const settled = await Promise.allSettled(
    input.mentionedAiAccounts.map((account) =>
      generateAndSaveAiReply(account, input.rootPost, deps),
    ),
  );

  return collectAiReplyResults(input.mentionedAiAccounts, settled);
}

const defaultDeps: CreatePostDeps = {
  findAiAccounts,
  insertRootPost,
  generateAiReplies,
};

/**
 * Creates a human root post, then generates AI replies for valid mentions.
 * Human posts are never rolled back when AI generation or reply save fails.
 */
export async function createPost(
  input: CreatePostInput,
  deps: CreatePostDeps = defaultDeps,
): Promise<CreatePostResult> {
  const content = input.content.trim();
  if (input.author.accountType !== "human") {
    throw new CreatePostError(
      "AUTHOR_NOT_HUMAN",
      "Post author must be a human account",
    );
  }

  const post = await saveRootPost(deps, input.author.id, content);
  const aiAccounts = await deps.findAiAccounts();
  const mentionedAiAccounts = extractMentionedAiAccounts(content, aiAccounts);
  const mentionedAiHandles = mentionedAiAccounts.map(
    (account) => account.handle,
  );

  if (mentionedAiAccounts.length === 0) {
    return {
      post,
      aiReplies: [],
      aiReplyStatus: "not_requested",
      mentionedAiHandles: [],
      succeededAiHandles: [],
      failedAi: [],
    };
  }

  const generated = await deps.generateAiReplies({
    rootPost: post,
    mentionedAiAccounts,
  });

  return {
    post,
    aiReplies: generated.aiReplies,
    aiReplyStatus: resolveAiReplyStatus({
      mentionedCount: mentionedAiAccounts.length,
      succeededCount: generated.succeededAiHandles.length,
      failedCount: generated.failedAi.length,
      disabled: generated.disabled === true,
    }),
    mentionedAiHandles,
    succeededAiHandles: generated.succeededAiHandles,
    failedAi: generated.failedAi,
  };
}

async function saveRootPost(
  deps: Pick<CreatePostDeps, "insertRootPost">,
  authorId: string,
  content: string,
): Promise<Post> {
  try {
    const post = await deps.insertRootPost({
      authorId,
      content,
    });

    if (post.parentPostId !== null) {
      throw new CreatePostError(
        "POST_SAVE_FAILED",
        "Human post must be a root post",
      );
    }

    return post;
  } catch (error: unknown) {
    if (error instanceof CreatePostError) {
      throw error;
    }

    if (error instanceof RepositoryError) {
      throw new CreatePostError(
        "POST_SAVE_FAILED",
        "Failed to save root post",
        {
          cause: error,
        },
      );
    }

    throw error;
  }
}

async function generateAndSaveAiReply(
  account: Account,
  rootPost: Post,
  deps: GenerateAiRepliesDeps,
): Promise<Post> {
  if (account.personaKey === null) {
    throw new AiReplyAttemptError("GENERATION_FAILED");
  }

  let content: string;
  try {
    content = await deps.generateReply({
      personaKey: account.personaKey,
      rootPost: {
        content: rootPost.content,
        author: { handle: rootPost.author.handle },
      },
      // First-wave replies run in parallel; sibling AI replies are not context.
      existingReplies: [],
    });
  } catch (error: unknown) {
    throw new AiReplyAttemptError("GENERATION_FAILED", { cause: error });
  }

  try {
    return await deps.insertAiReply({
      authorId: account.id,
      parentPostId: rootPost.id,
      content,
    });
  } catch (error: unknown) {
    throw new AiReplyAttemptError("REPLY_SAVE_FAILED", { cause: error });
  }
}

function collectAiReplyResults(
  mentionedAiAccounts: readonly Account[],
  settled: readonly PromiseSettledResult<Post>[],
): GenerateAiRepliesResult {
  const aiReplies: Post[] = [];
  const succeededAiHandles: string[] = [];
  const failedAi: FailedAi[] = [];

  for (const [index, result] of settled.entries()) {
    const account = mentionedAiAccounts[index];
    if (account === undefined) {
      continue;
    }

    if (result.status === "fulfilled") {
      aiReplies.push(result.value);
      succeededAiHandles.push(account.handle);
      continue;
    }

    failedAi.push({
      handle: account.handle,
      code: failedAiCodeFromReason(result.reason),
    });
  }

  return { aiReplies, succeededAiHandles, failedAi };
}

function failedAiCodeFromReason(reason: unknown): FailedAiCode {
  if (reason instanceof AiReplyAttemptError) {
    return reason.code;
  }

  return "GENERATION_FAILED";
}

function resolveAiReplyStatus(params: {
  mentionedCount: number;
  succeededCount: number;
  failedCount: number;
  disabled: boolean;
}): AiReplyStatus {
  if (params.mentionedCount === 0) {
    return "not_requested";
  }

  if (params.disabled) {
    return "disabled";
  }

  if (
    params.succeededCount === params.mentionedCount &&
    params.failedCount === 0
  ) {
    return "completed";
  }

  if (params.succeededCount === 0) {
    return "failed";
  }

  return "partial";
}

class AiReplyAttemptError extends Error {
  readonly name = "AiReplyAttemptError";
  readonly code: FailedAiCode;

  constructor(code: FailedAiCode, options?: { cause?: unknown }) {
    super(`AI reply attempt failed: ${code}`, options);
    this.code = code;
  }
}
