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
import { GetProfileError } from "@/lib/services/errors";
import { getProfile } from "@/lib/services/get-profile";
import { getProfileParamsSchema } from "@/lib/validations/profile";

const PROFILE_CACHE_CONTROL =
  "public, s-maxage=3600, stale-while-revalidate=86400" as const;

type RouteContext = {
  params: Promise<{
    handle: string;
  }>;
};

export async function GET(_request: NextRequest, context: RouteContext) {
  const requestId = createRequestId();
  const { handle } = await context.params;

  const parsedParams = getProfileParamsSchema.safeParse({ handle });
  if (!parsedParams.success) {
    return validationErrorResponse(requestId, parsedParams.error);
  }

  try {
    const result = await getProfile({
      handle: parsedParams.data.handle,
    });
    return jsonOk(result, {
      headers: {
        "Cache-Control": PROFILE_CACHE_CONTROL,
      },
    });
  } catch (error: unknown) {
    return mapGetProfileError(requestId, error);
  }
}

function mapGetProfileError(requestId: string, error: unknown) {
  if (error instanceof GetProfileError) {
    return jsonError(
      requestId,
      404,
      "PROFILE_NOT_FOUND",
      "指定されたプロフィールが見つかりません。",
    );
  }

  if (error instanceof RepositoryError) {
    return databaseErrorResponse(requestId);
  }

  return internalErrorResponse(requestId);
}
