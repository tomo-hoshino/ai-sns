import type { TimelinePost } from "@/types/post";

/**
 * Appends new timeline posts while dropping any whose id already exists.
 * Keeps the original order of both existing and incoming items.
 */
export function appendUniquePosts(
  existing: readonly TimelinePost[],
  incoming: readonly TimelinePost[],
): TimelinePost[] {
  const seenIds = new Set(existing.map((post) => post.id));
  const uniqueIncoming = incoming.filter((post) => {
    if (seenIds.has(post.id)) {
      return false;
    }
    seenIds.add(post.id);
    return true;
  });

  return [...existing, ...uniqueIncoming];
}
