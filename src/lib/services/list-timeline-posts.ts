import "server-only";

import {
  findTimelinePage,
  type FindTimelinePageParams,
  type FindTimelinePageResult,
} from "@/lib/repositories/post-repository";
import { encodeTimelineCursor } from "@/lib/validations/common";
import { listPostsResponseSchema } from "@/lib/validations/post";
import type { ListPostsResponse } from "@/types/api";
import type { TimelinePageCursor, TimelinePost } from "@/types/post";

export type ListTimelinePostsInput = {
  limit: number;
  cursor?: TimelinePageCursor;
};

export type ListTimelinePostsDeps = {
  findTimelinePage: (
    params: FindTimelinePageParams,
  ) => Promise<FindTimelinePageResult>;
};

const defaultDeps: ListTimelinePostsDeps = {
  findTimelinePage,
};

/**
 * Loads one timeline page of root posts and builds the API pagination fields.
 * Reply posts are excluded by the repository (parent_post_id IS NULL).
 */
export async function listTimelinePosts(
  input: ListTimelinePostsInput,
  deps: ListTimelinePostsDeps = defaultDeps,
): Promise<ListPostsResponse> {
  const { posts, hasMore } = await deps.findTimelinePage({
    limit: input.limit,
    cursor: input.cursor,
  });

  const response = {
    data: posts,
    page: {
      nextCursor: buildNextCursor(posts, hasMore),
      hasMore,
    },
  } satisfies ListPostsResponse;

  return listPostsResponseSchema.parse(response);
}

function buildNextCursor(
  posts: TimelinePost[],
  hasMore: boolean,
): string | null {
  if (!hasMore) {
    return null;
  }

  const lastPost = posts.at(-1);
  if (lastPost === undefined) {
    return null;
  }

  return encodeTimelineCursor({
    createdAt: lastPost.createdAt,
    id: lastPost.id,
  });
}
