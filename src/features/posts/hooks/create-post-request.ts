import {
  apiErrorResponseSchema,
  countUnicodeCodePoints,
  MAX_POST_LENGTH,
} from "@/lib/validations/common";
import {
  createPostResponseSchema,
  type CreatePostResponseParsed,
} from "@/lib/validations/post";

const FALLBACK_CREATE_POST_ERROR =
  "投稿に失敗しました。時間をおいて再試行してください。";

export type CreatePostClientResult =
  | { ok: true; response: CreatePostResponseParsed }
  | { ok: false; message: string };

/**
 * POSTs a root post to `/api/posts` and validates the response shape.
 * Never throws; callers keep composer input on `ok: false`.
 */
export async function createPostRequest(
  content: string,
): Promise<CreatePostClientResult> {
  let response: Response;
  try {
    response = await fetch("/api/posts", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ content }),
      cache: "no-store",
    });
  } catch {
    return { ok: false, message: FALLBACK_CREATE_POST_ERROR };
  }

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    return { ok: false, message: FALLBACK_CREATE_POST_ERROR };
  }

  if (!response.ok) {
    return { ok: false, message: readSafeErrorMessage(body) };
  }

  const parsed = createPostResponseSchema.safeParse(body);
  if (!parsed.success) {
    return { ok: false, message: FALLBACK_CREATE_POST_ERROR };
  }

  return { ok: true, response: parsed.data };
}

export function canSubmitPostContent(content: string): boolean {
  const trimmedLength = countUnicodeCodePoints(content.trim());
  return trimmedLength >= 1 && trimmedLength <= MAX_POST_LENGTH;
}

function readSafeErrorMessage(body: unknown): string {
  const parsedError = apiErrorResponseSchema.safeParse(body);
  if (!parsedError.success) {
    return FALLBACK_CREATE_POST_ERROR;
  }

  const { message, details } = parsedError.data.error;
  const contentDetail = details?.find(
    (detail) => detail.path === "content" && detail.message.trim().length > 0,
  );
  if (contentDetail !== undefined) {
    return contentDetail.message;
  }

  const trimmed = message.trim();
  return trimmed.length > 0 ? trimmed : FALLBACK_CREATE_POST_ERROR;
}
