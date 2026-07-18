"use client";

import { LoadMoreButton } from "@/features/posts/components/load-more-button";
import { PostCard } from "@/features/posts/components/post-card";
import { useLoadMorePosts } from "@/features/posts/hooks/use-load-more-posts";
import type { Account } from "@/types/account";
import type { TimelinePost } from "@/types/post";

export type PostListProps = {
  posts: readonly TimelinePost[];
  aiAccounts: readonly Account[];
  initialNextCursor?: string | null;
  initialHasMore?: boolean;
};

export function PostList({
  posts: initialPosts,
  aiAccounts,
  initialNextCursor = null,
  initialHasMore = false,
}: PostListProps) {
  const { posts, hasMore, isLoading, errorMessage, loadMore } =
    useLoadMorePosts({
      initialPosts,
      initialNextCursor,
      initialHasMore,
    });

  if (posts.length === 0) {
    return (
      <div
        role="status"
        className="border-border bg-card text-muted-foreground rounded-xl border px-4 py-10 text-center"
      >
        <p className="text-foreground text-sm font-medium">
          まだ投稿がありません
        </p>
        <p className="mt-2 text-sm">
          最初の投稿を書いて、AI社員にメンションしてみましょう。
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <ul className="space-y-3">
        {posts.map((post) => (
          <li key={post.id}>
            <PostCard
              post={post}
              aiAccounts={aiAccounts}
              replyCount={post.replyCount}
            />
          </li>
        ))}
      </ul>

      <LoadMoreButton
        hasMore={hasMore}
        isLoading={isLoading}
        errorMessage={errorMessage}
        onLoadMore={() => {
          void loadMore();
        }}
      />
    </div>
  );
}
