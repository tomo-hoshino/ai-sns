/**
 * Thrown when a Supabase call fails or a DB row cannot be mapped safely.
 * Callers must not surface cause details to clients.
 */
export class RepositoryError extends Error {
  readonly name = "RepositoryError";

  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
  }
}
