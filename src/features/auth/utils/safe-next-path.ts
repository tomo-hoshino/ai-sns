/**
 * Restrict post-login redirects to same-origin relative paths.
 */
export function resolveSafeNextPath(next: string | null | undefined): string {
  if (typeof next !== "string" || next.trim() === "") {
    return "/";
  }
  if (!next.startsWith("/") || next.startsWith("//")) {
    return "/";
  }
  return next;
}
