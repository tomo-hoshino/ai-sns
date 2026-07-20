import type { NextRequest, NextResponse } from "next/server";

import { parseJsonBody } from "@/lib/api/request";
import {
  createRequestId,
  databaseErrorResponse,
  internalErrorResponse,
  jsonError,
  jsonOk,
  validationErrorResponse,
} from "@/lib/api/response";
import {
  FIXED_HUMAN_ACCOUNT_ID,
  findHumanAccountById,
} from "@/lib/repositories/account-repository";
import { RepositoryError } from "@/lib/repositories/errors";
import { createPost } from "@/lib/services/create-post";
import { CreatePostError } from "@/lib/services/errors";
import { listTimelinePosts } from "@/lib/services/list-timeline-posts";
import { getSessionUser } from "@/lib/supabase/get-session-user";
import {
  createPostRequestSchema,
  createPostResponseSchema,
  listPostsQuerySchema,
} from "@/lib/validations/post";
import type { Account } from "@/types/account";
import type { CreatePostResponse } from "@/types/api";

export async function GET(request: NextRequest) {
  const requestId = createRequestId();

  const parsedQuery = listPostsQuerySchema.safeParse(
    readListPostsQuery(request),
  );
  if (!parsedQuery.success) {
    return validationErrorResponse(requestId, parsedQuery.error);
  }

  try {
    const result = await listTimelinePosts({
      limit: parsedQuery.data.limit,
      cursor: parsedQuery.data.cursor,
    });
    return jsonOk(result);
  } catch (error: unknown) {
    if (error instanceof RepositoryError) {
      return databaseErrorResponse(requestId);
    }
    return internalErrorResponse(requestId);
  }
}

export async function POST(request: NextRequest) {
  const requestId = createRequestId();

  const parsedBody = await parseJsonBody(request);
  if (!parsedBody.ok) {
    return jsonParseErrorResponse(requestId, parsedBody.reason);
  }

  const parsedRequest = createPostRequestSchema.safeParse(parsedBody.value);
  if (!parsedRequest.success) {
    return validationErrorResponse(requestId, parsedRequest.error);
  }

  const authorResult = await resolvePostAuthor(requestId);
  if (!authorResult.ok) {
    return authorResult.response;
  }

  try {
    const result = await createPost({
      content: parsedRequest.data.content,
      author: authorResult.author,
    });

    const body = {
      data: {
        post: result.post,
        aiReplies: result.aiReplies,
      },
      meta: {
        aiReplyStatus: result.aiReplyStatus,
        mentionedAiHandles: result.mentionedAiHandles,
        succeededAiHandles: result.succeededAiHandles,
        failedAi: result.failedAi,
      },
      requestId,
    } satisfies CreatePostResponse;

    createPostResponseSchema.parse(body);
    return jsonOk(body, { status: 201 });
  } catch (error: unknown) {
    return mapCreatePostError(requestId, error);
  }
}

/**
 * Session human when logged in; shared Guest (`@guest`) when not.
 * Missing profile → 500 INTERNAL_ERROR (ADR-010 / T-141).
 */
async function resolvePostAuthor(
  requestId: string,
): Promise<
  { ok: true; author: Account } | { ok: false; response: NextResponse }
> {
  const sessionUser = await getSessionUser();
  const authorId =
    sessionUser === null ? FIXED_HUMAN_ACCOUNT_ID : sessionUser.id;

  try {
    const author = await findHumanAccountById(authorId);
    if (author === null) {
      return { ok: false, response: internalErrorResponse(requestId) };
    }
    return { ok: true, author };
  } catch (error: unknown) {
    if (error instanceof RepositoryError) {
      return { ok: false, response: databaseErrorResponse(requestId) };
    }
    return { ok: false, response: internalErrorResponse(requestId) };
  }
}

function readListPostsQuery(request: NextRequest): {
  limit?: string;
  cursor?: string;
} {
  const { searchParams } = request.nextUrl;
  const limit = searchParams.get("limit");
  const cursor = searchParams.get("cursor");

  return {
    limit: limit === null ? undefined : limit,
    cursor: cursor === null ? undefined : cursor,
  };
}

function jsonParseErrorResponse(
  requestId: string,
  reason: "content_type" | "invalid_json",
) {
  const message =
    reason === "content_type"
      ? "Content-Typeはapplication/jsonである必要があります。"
      : "JSONの形式が不正です。";

  return jsonError(
    requestId,
    400,
    "VALIDATION_ERROR",
    "入力内容を確認してください。",
    [{ path: "(root)", message }],
  );
}

function mapCreatePostError(requestId: string, error: unknown) {
  if (error instanceof CreatePostError) {
    if (error.code === "POST_SAVE_FAILED") {
      return databaseErrorResponse(requestId, "投稿の保存に失敗しました。");
    }
    return internalErrorResponse(requestId);
  }

  if (error instanceof RepositoryError) {
    return databaseErrorResponse(requestId, "投稿の保存に失敗しました。");
  }

  return internalErrorResponse(requestId);
}
