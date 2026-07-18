"use client";

import { useRef, useState } from "react";

import { appendUniquePosts } from "@/features/posts/utils/append-unique-posts";
import {
  apiErrorResponseSchema,
  DEFAULT_TIMELINE_LIMIT,
} from "@/lib/validations/common";
import { listPostsResponseSchema } from "@/lib/validations/post";
import type { TimelinePost } from "@/types/post";

const LOAD_MORE_ERROR_MESSAGE =
  "追加の投稿を読み込めませんでした。再試行してください。";

export type UseLoadMorePostsInput = {
  initialPosts: readonly TimelinePost[];
  initialNextCursor: string | null;
  initialHasMore: boolean;
};

export type UseLoadMorePostsResult = {
  posts: TimelinePost[];
  hasMore: boolean;
  isLoading: boolean;
  errorMessage: string | null;
  loadMore: () => Promise<void>;
};

export function useLoadMorePosts(
  input: UseLoadMorePostsInput,
): UseLoadMorePostsResult {
  const [posts, setPosts] = useState<TimelinePost[]>(() => [
    ...input.initialPosts,
  ]);
  const [nextCursor, setNextCursor] = useState<string | null>(
    input.initialNextCursor,
  );
  const [hasMore, setHasMore] = useState(input.initialHasMore);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const isLoadingRef = useRef(false);

  async function loadMore(): Promise<void> {
    if (isLoadingRef.current || !hasMore || nextCursor === null) {
      return;
    }

    isLoadingRef.current = true;
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const page = await fetchTimelinePage(nextCursor);
      setPosts((current) => appendUniquePosts(current, page.data));
      setNextCursor(page.page.nextCursor);
      setHasMore(page.page.hasMore);
    } catch {
      setErrorMessage(LOAD_MORE_ERROR_MESSAGE);
    } finally {
      isLoadingRef.current = false;
      setIsLoading(false);
    }
  }

  return {
    posts,
    hasMore,
    isLoading,
    errorMessage,
    loadMore,
  };
}

async function fetchTimelinePage(cursor: string) {
  const params = new URLSearchParams({
    limit: String(DEFAULT_TIMELINE_LIMIT),
    cursor,
  });

  const response = await fetch(`/api/posts?${params.toString()}`, {
    method: "GET",
    headers: { Accept: "application/json" },
    cache: "no-store",
  });

  const body: unknown = await response.json();

  if (!response.ok) {
    const parsedError = apiErrorResponseSchema.safeParse(body);
    if (parsedError.success) {
      throw new Error(parsedError.data.error.message);
    }
    throw new Error(LOAD_MORE_ERROR_MESSAGE);
  }

  return listPostsResponseSchema.parse(body);
}
