import type { Account } from "@/types/account";
import type { Post, TimelinePost } from "@/types/post";

export type ApiErrorCode =
  | "VALIDATION_ERROR"
  | "THREAD_NOT_FOUND"
  | "METHOD_NOT_ALLOWED"
  | "DATABASE_ERROR"
  | "INTERNAL_ERROR";

export interface ApiErrorDetail {
  path: string;
  message: string;
}

export interface ApiErrorResponse {
  error: {
    code: ApiErrorCode;
    message: string;
    details?: ApiErrorDetail[];
  };
  requestId: string;
}

export type AiReplyStatus =
  "not_requested" | "completed" | "partial" | "failed" | "disabled";

export type FailedAiCode = "GENERATION_FAILED" | "REPLY_SAVE_FAILED";

export interface FailedAi {
  handle: string;
  code: FailedAiCode;
}

export interface CreatePostRequest {
  content: string;
}

export interface CreatePostResponse {
  data: {
    post: Post;
    aiReplies: Post[];
  };
  meta: {
    aiReplyStatus: AiReplyStatus;
    mentionedAiHandles: string[];
    succeededAiHandles: string[];
    failedAi: FailedAi[];
  };
  requestId: string;
}

export interface ListPostsResponse {
  data: TimelinePost[];
  page: {
    nextCursor: string | null;
    hasMore: boolean;
  };
}

export interface GetThreadResponse {
  data: {
    root: Post;
    replies: Post[];
  };
}

export interface ListAiAccountsResponse {
  data: Account[];
}
