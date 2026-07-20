export type CreatePostErrorCode = "AUTHOR_NOT_HUMAN" | "POST_SAVE_FAILED";

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

export type GetProfileErrorCode = "PROFILE_NOT_FOUND";

/**
 * Domain error from getProfile when no account matches the handle.
 */
export class GetProfileError extends Error {
  readonly name = "GetProfileError";
  readonly code: GetProfileErrorCode;

  constructor(
    code: GetProfileErrorCode,
    message: string,
    options?: { cause?: unknown },
  ) {
    super(message, options);
    this.code = code;
  }
}
