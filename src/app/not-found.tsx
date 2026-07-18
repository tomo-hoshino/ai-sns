import Link from "next/link";

export default function NotFound() {
  return (
    <section
      aria-labelledby="not-found-heading"
      className="border-border bg-card space-y-4 rounded-xl border px-4 py-10 text-center"
    >
      <div className="space-y-2">
        <h1
          id="not-found-heading"
          className="text-foreground text-lg font-semibold tracking-tight"
        >
          ページが見つかりません
        </h1>
        <p className="text-muted-foreground text-sm">
          指定された投稿またはページは存在しないか、削除された可能性があります。
        </p>
      </div>

      <Link
        href="/"
        className="bg-primary text-primary-foreground focus-visible:border-ring focus-visible:ring-ring/50 inline-flex h-8 items-center justify-center rounded-lg px-3 text-sm font-medium outline-none focus-visible:ring-3"
      >
        タイムラインへ戻る
      </Link>
    </section>
  );
}
