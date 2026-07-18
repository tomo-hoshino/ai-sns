import { Skeleton } from "@/components/ui/skeleton";

export default function ThreadLoading() {
  return (
    <section aria-labelledby="thread-heading" className="space-y-4">
      <div className="space-y-3">
        <Skeleton className="h-4 w-36" />
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

      <div
        role="status"
        aria-busy="true"
        aria-label="スレッドを読み込み中"
        className="space-y-5"
      >
        <div className="space-y-2">
          <Skeleton className="h-4 w-16" />
          <PostCardSkeleton emphasized />
        </div>

        <div className="space-y-3">
          <Skeleton className="h-4 w-20" />
          <div className="border-border space-y-3 border-l-2 pl-3 sm:pl-4">
            <PostCardSkeleton />
            <PostCardSkeleton />
          </div>
        </div>
      </div>
    </section>
  );
}

function PostCardSkeleton({ emphasized = false }: { emphasized?: boolean }) {
  return (
    <div
      className={
        emphasized
          ? "bg-card ring-foreground/20 flex flex-col gap-3 rounded-xl border-l-4 border-l-transparent py-3 shadow-sm ring-2"
          : "bg-card ring-foreground/10 flex flex-col gap-3 rounded-xl border-l-4 border-l-transparent py-3 ring-1"
      }
    >
      <div className="flex items-start gap-3 px-3">
        <Skeleton className="size-8 shrink-0 rounded-full" />
        <div className="min-w-0 flex-1 space-y-2">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-3 w-28" />
        </div>
      </div>
      <div className="space-y-2 px-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
      <div className="bg-muted/50 flex items-center justify-between border-t px-3 py-3">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-3 w-20" />
      </div>
    </div>
  );
}
