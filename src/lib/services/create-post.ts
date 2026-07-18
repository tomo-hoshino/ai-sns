import "server-only";

import { extractMentionedAiAccounts } from "@/lib/ai/mentions";
import {
  findAiAccounts,
  findFixedHumanAccount,
} from "@/lib/repositories/account-repository";
import { RepositoryError } from "@/lib/repositories/errors";
import {
  insertRootPost,
  type InsertRootPostInput,
} from "@/lib/repositories/post-repository";
import { CreatePostError } from "@/lib/services/errors";
import type { Account } from "@/types/account";
import type { AiReplyStatus, FailedAi } from "@/types/api";
import type { Post } from "@/types/post";

export type CreatePostInput = {
  /** Trimmed post body (1–300 Unicode code points). Validated at the API boundary. */
  content: string;
};

/**
 * AI reply generation hook for T-025.
 * T-013 only declares the type; default createPost does not call it.
 */
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

export type CreatePostDeps = {
  findFixedHumanAccount: () => Promise<Account | null>;
  findAiAccounts: () => Promise<Account[]>;
  insertRootPost: (input: InsertRootPostInput) => Promise<Post>;
  generateAiReplies?: GenerateAiReplies;
};

export type CreatePostResult = {
  post: Post;
  aiReplies: Post[];
  aiReplyStatus: AiReplyStatus;
  mentionedAiHandles: string[];
  succeededAiHandles: string[];
  failedAi: FailedAi[];
};

const defaultDeps: CreatePostDeps = {
  findFixedHumanAccount,
  findAiAccounts,
  insertRootPost,
};

/**
 * Creates a human root post and extracts valid AI mentions.
 * AI reply generation is optional via deps.generateAiReplies (wired in T-025).
 */
export async function createPost(
  input: CreatePostInput,
  deps: CreatePostDeps = defaultDeps,
): Promise<CreatePostResult> {
  const content = input.content.trim();
  const author = await deps.findFixedHumanAccount();
  if (author === null) {
    throw new CreatePostError(
      "FIXED_HUMAN_NOT_FOUND",
      "Fixed human account is missing",
    );
  }

  const post = await saveRootPost(deps, author.id, content);
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

  if (deps.generateAiReplies === undefined) {
    // T-013: extract mentions only; AI generation is connected in T-025.
    return {
      post,
      aiReplies: [],
      aiReplyStatus: "not_requested",
      mentionedAiHandles,
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
  deps: CreatePostDeps,
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
