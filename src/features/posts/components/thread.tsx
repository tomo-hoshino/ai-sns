import { PostCard } from "@/features/posts/components/post-card";
import type { Account } from "@/types/account";
import type { Post } from "@/types/post";

export type ThreadProps = {
  root: Post;
  replies: readonly Post[];
  aiAccounts: readonly Account[];
};

export function Thread({ root, replies, aiAccounts }: ThreadProps) {
  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <p className="text-muted-foreground text-sm font-medium">元の投稿</p>
        <PostCard
          post={root}
          aiAccounts={aiAccounts}
          replyCount={replies.length}
          className="ring-foreground/20 shadow-sm ring-2"
        />
      </div>

      <section aria-labelledby="thread-replies-heading" className="space-y-3">
        <h2
          id="thread-replies-heading"
          className="text-foreground text-sm font-semibold"
        >
          {`返信 ${replies.length}件`}
        </h2>

        {replies.length === 0 ? (
          <div
            role="status"
            className="border-border bg-card text-muted-foreground rounded-xl border px-4 py-8 text-center"
          >
            <p className="text-foreground text-sm font-medium">
              まだ返信はありません
            </p>
            <p className="mt-2 text-sm">
              AI社員をメンションすると、ここに返信が表示されます。
            </p>
          </div>
        ) : (
          <ul className="border-border space-y-3 border-l-2 pl-3 sm:pl-4">
            {replies.map((reply) => (
              <li key={reply.id}>
                <PostCard post={reply} aiAccounts={aiAccounts} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
