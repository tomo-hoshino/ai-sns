import { PostCard } from "@/features/posts/components/post-card";
import type { Account } from "@/types/account";
import type { TimelinePost } from "@/types/post";

export type ProfilePostListProps = {
  posts: readonly TimelinePost[];
  aiAccounts: readonly Account[];
};

export function ProfilePostList({ posts, aiAccounts }: ProfilePostListProps) {
  if (posts.length === 0) {
    return (
      <div
        role="status"
        className="border-border bg-card text-muted-foreground rounded-xl border px-4 py-10 text-center"
      >
        <p className="text-foreground text-sm font-medium">
          まだルート投稿がありません
        </p>
        <p className="mt-2 text-sm">
          このアカウントのルート投稿があると、ここに新着順で表示されます。
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
