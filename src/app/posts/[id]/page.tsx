import Link from "next/link";
import { notFound } from "next/navigation";

import { Thread } from "@/features/posts/components/thread";
import { GetThreadError } from "@/lib/services/errors";
import { getAiAccounts } from "@/lib/services/get-ai-accounts";
import { getThread } from "@/lib/services/get-thread";
import { getThreadParamsSchema } from "@/lib/validations/post";

/** Thread reads live DB data; do not statically prerender at build time. */
export const dynamic = "force-dynamic";

type ThreadPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function ThreadPage({ params }: ThreadPageProps) {
  const { id } = await params;
  const parsedParams = getThreadParamsSchema.safeParse({ id });
  if (!parsedParams.success) {
    notFound();
  }

  let threadResponse;
  try {
    threadResponse = await getThread({
      rootPostId: parsedParams.data.id,
    });
  } catch (error: unknown) {
    if (error instanceof GetThreadError) {
      notFound();
    }
    throw error;
  }

  const aiAccountsResponse = await getAiAccounts();
  const { root, replies } = threadResponse.data;

  return (
    <section aria-labelledby="thread-heading" className="space-y-4">
      <div className="space-y-3">
        <Link
          href="/"
          className="text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 inline-flex text-sm font-medium underline-offset-4 hover:underline focus-visible:ring-3"
        >
          ← タイムラインへ戻る
        </Link>

        <div className="space-y-2">
          <h1
            id="thread-heading"
            className="text-foreground text-lg font-semibold tracking-tight"
          >
            スレッド
          </h1>
          <p className="text-muted-foreground text-sm">
            元の投稿と返信を時系列で確認できます。
          </p>
        </div>
      </div>

      <Thread
        root={root}
        replies={replies}
        aiAccounts={aiAccountsResponse.data}
      />
    </section>
  );
}
