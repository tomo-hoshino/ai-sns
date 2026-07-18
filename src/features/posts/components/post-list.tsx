import { PostCard } from "@/features/posts/components/post-card";
import type { Account } from "@/types/account";
import type { TimelinePost } from "@/types/post";

export type PostListProps = {
  posts: readonly TimelinePost[];
  aiAccounts: readonly Account[];
};

export function PostList({ posts, aiAccounts }: PostListProps) {
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
  );
}
