import type { NextRequest } from "next/server";

import {
  createRequestId,
  databaseErrorResponse,
  internalErrorResponse,
  jsonOk,
  validationErrorResponse,
} from "@/lib/api/response";
import { RepositoryError } from "@/lib/repositories/errors";
import { listTimelinePosts } from "@/lib/services/list-timeline-posts";
import { listPostsQuerySchema } from "@/lib/validations/post";

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
