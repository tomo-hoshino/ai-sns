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
