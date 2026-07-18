import { NextResponse } from "next/server";
import type { ZodError } from "zod";

import { apiErrorResponseSchema } from "@/lib/validations/common";
import type {
  ApiErrorCode,
  ApiErrorDetail,
  ApiErrorResponse,
} from "@/types/api";

export const NO_STORE_JSON_HEADERS = {
  "Cache-Control": "no-store",
  "Content-Type": "application/json; charset=utf-8",
} as const;

export function createRequestId(): string {
  return crypto.randomUUID();
}

export function jsonOk<T>(
  body: T,
  init?: { status?: number; headers?: HeadersInit },
): NextResponse {
  return NextResponse.json(body, {
    status: init?.status ?? 200,
    headers: {
      ...NO_STORE_JSON_HEADERS,
      ...init?.headers,
    },
  });
}

export function jsonError(
  requestId: string,
  status: number,
  code: ApiErrorCode,
  message: string,
  details?: ApiErrorDetail[],
): NextResponse {
  const body: ApiErrorResponse = {
    error:
      details === undefined ? { code, message } : { code, message, details },
    requestId,
  };

  apiErrorResponseSchema.parse(body);

  return NextResponse.json(body, {
    status,
    headers: NO_STORE_JSON_HEADERS,
  });
}

export function validationErrorResponse(
  requestId: string,
  error: ZodError,
): NextResponse {
  const details: ApiErrorDetail[] = error.issues.map((issue) => ({
    path: issue.path.length > 0 ? issue.path.join(".") : "(root)",
    message: issue.message,
  }));

  return jsonError(
    requestId,
    400,
    "VALIDATION_ERROR",
    "入力内容を確認してください。",
    details,
  );
}

export function databaseErrorResponse(requestId: string): NextResponse {
  return jsonError(
    requestId,
    500,
    "DATABASE_ERROR",
    "データの取得に失敗しました。",
  );
}

export function internalErrorResponse(requestId: string): NextResponse {
  return jsonError(
    requestId,
    500,
    "INTERNAL_ERROR",
    "サーバーでエラーが発生しました。",
  );
}
