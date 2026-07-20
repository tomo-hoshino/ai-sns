import "server-only";

import {
  findRootPostsByAuthorId,
  type FindRootPostsByAuthorIdParams,
  type FindRootPostsByAuthorIdResult,
} from "@/lib/repositories/post-repository";
import type { TimelinePost } from "@/types/post";

export type ListProfilePostsInput = {
  authorId: string;
  limit: number;
};

export type ListProfilePostsResult = {
  posts: TimelinePost[];
};

export type ListProfilePostsDeps = {
  findRootPostsByAuthorId: (
    params: FindRootPostsByAuthorIdParams,
  ) => Promise<FindRootPostsByAuthorIdResult>;
};

const defaultDeps: ListProfilePostsDeps = {
  findRootPostsByAuthorId,
};

/**
 * Loads root posts for one profile author (newest first).
 * Reply posts are excluded by the repository.
 */
export async function listProfilePosts(
  input: ListProfilePostsInput,
  deps: ListProfilePostsDeps = defaultDeps,
): Promise<ListProfilePostsResult> {
  const { posts } = await deps.findRootPostsByAuthorId({
    authorId: input.authorId,
    limit: input.limit,
  });

  return { posts };
}
