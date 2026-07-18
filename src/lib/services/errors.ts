export type CreatePostErrorCode = "FIXED_HUMAN_NOT_FOUND" | "POST_SAVE_FAILED";

/**
 * Domain error from createPost. Route Handlers map codes to HTTP status.
 * Cause details must not be exposed to clients.
 */
export class CreatePostError extends Error {
  readonly name = "CreatePostError";
  readonly code: CreatePostErrorCode;

  constructor(
    code: CreatePostErrorCode,
    message: string,
    options?: { cause?: unknown },
  ) {
    super(message, options);
    this.code = code;
  }
}

export type GetThreadErrorCode = "THREAD_NOT_FOUND";

/**
 * Domain error from getThread. Missing roots and reply IDs both map here;
 * the repository returns null for either case.
 */
export class GetThreadError extends Error {
  readonly name = "GetThreadError";
  readonly code: GetThreadErrorCode;

  constructor(
    code: GetThreadErrorCode,
    message: string,
    options?: { cause?: unknown },
  ) {
    super(message, options);
    this.code = code;
  }
}
