import type { NextRequest } from "next/server";

import {
  createRequestId,
  databaseErrorResponse,
  internalErrorResponse,
  jsonError,
  jsonOk,
  validationErrorResponse,
} from "@/lib/api/response";
import { RepositoryError } from "@/lib/repositories/errors";
import { GetThreadError } from "@/lib/services/errors";
import { getThread } from "@/lib/services/get-thread";
import { getThreadParamsSchema } from "@/lib/validations/post";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(_request: NextRequest, context: RouteContext) {
  const requestId = createRequestId();
  const { id } = await context.params;

  const parsedParams = getThreadParamsSchema.safeParse({ id });
  if (!parsedParams.success) {
    return validationErrorResponse(requestId, parsedParams.error);
  }

  try {
    const result = await getThread({
      rootPostId: parsedParams.data.id,
    });
    return jsonOk(result);
  } catch (error: unknown) {
    return mapGetThreadError(requestId, error);
  }
}

function mapGetThreadError(requestId: string, error: unknown) {
  if (error instanceof GetThreadError) {
    return jsonError(
      requestId,
      404,
      "THREAD_NOT_FOUND",
      "指定されたスレッドが見つかりません。",
    );
  }

  if (error instanceof RepositoryError) {
    return databaseErrorResponse(requestId);
  }

  return internalErrorResponse(requestId);
}
