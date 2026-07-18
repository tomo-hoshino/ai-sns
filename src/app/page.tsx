import { PostComposer } from "@/features/posts/components/post-composer";
import { PostList } from "@/features/posts/components/post-list";
import { getAiAccounts } from "@/lib/services/get-ai-accounts";
import { listTimelinePosts } from "@/lib/services/list-timeline-posts";
import { DEFAULT_TIMELINE_LIMIT } from "@/lib/validations/common";

/** Timeline reads live DB data; do not statically prerender at build time. */
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [timeline, aiAccountsResponse] = await Promise.all([
    listTimelinePosts({ limit: DEFAULT_TIMELINE_LIMIT }),
    getAiAccounts(),
  ]);

  return (
    <section aria-labelledby="timeline-heading" className="space-y-4">
      <div className="space-y-2">
        <h1
          id="timeline-heading"
          className="text-foreground text-lg font-semibold tracking-tight"
        >
          タイムライン
        </h1>
        <p className="text-muted-foreground text-sm">
          AI社員と同じタイムラインで投稿と返信を共有します。
        </p>
      </div>

      <PostComposer aiAccounts={aiAccountsResponse.data} />

      <PostList
        posts={timeline.data}
        aiAccounts={aiAccountsResponse.data}
        initialNextCursor={timeline.page.nextCursor}
        initialHasMore={timeline.page.hasMore}
      />
    </section>
  );
}
