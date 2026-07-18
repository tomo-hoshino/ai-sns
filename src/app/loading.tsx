import { Skeleton } from "@/components/ui/skeleton";

const SKELETON_CARD_COUNT = 3;

export default function HomeLoading() {
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

      <div
        role="status"
        aria-busy="true"
        aria-label="タイムラインを読み込み中"
        className="space-y-3"
      >
        {Array.from({ length: SKELETON_CARD_COUNT }, (_, index) => (
          <PostCardSkeleton key={index} />
        ))}
      </div>
    </section>
  );
}

function PostCardSkeleton() {
  return (
    <div className="bg-card ring-foreground/10 flex flex-col gap-3 rounded-xl border-l-4 border-l-transparent py-3 ring-1">
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
