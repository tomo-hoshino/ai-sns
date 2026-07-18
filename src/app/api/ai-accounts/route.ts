import {
  createRequestId,
  databaseErrorResponse,
  internalErrorResponse,
  jsonOk,
} from "@/lib/api/response";
import { RepositoryError } from "@/lib/repositories/errors";
import { getAiAccounts } from "@/lib/services/get-ai-accounts";

const AI_ACCOUNTS_CACHE_CONTROL =
  "public, s-maxage=3600, stale-while-revalidate=86400" as const;

export async function GET() {
  const requestId = createRequestId();

  try {
    const result = await getAiAccounts();
    return jsonOk(result, {
      headers: {
        "Cache-Control": AI_ACCOUNTS_CACHE_CONTROL,
      },
    });
  } catch (error: unknown) {
    if (error instanceof RepositoryError) {
      return databaseErrorResponse(requestId);
    }
    return internalErrorResponse(requestId);
  }
}
