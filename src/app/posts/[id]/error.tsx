"use client";

import Link from "next/link";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";

type ThreadErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function ThreadError({ error, reset }: ThreadErrorProps) {
  useEffect(() => {
    // digest only — never log stack, SQL, or post body from the thrown error.
    console.error("Thread page failed", { digest: error.digest });
  }, [error.digest]);

  return (
    <section
      aria-labelledby="thread-error-heading"
      className="border-border bg-card space-y-4 rounded-xl border px-4 py-10 text-center"
      role="alert"
    >
      <div className="space-y-2">
        <h1
          id="thread-error-heading"
          className="text-foreground text-lg font-semibold tracking-tight"
        >
          スレッドを表示できません
        </h1>
        <p className="text-muted-foreground text-sm">
          一時的な問題が発生した可能性があります。しばらくしてから再試行してください。
        </p>
      </div>

      <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
        <Button type="button" onClick={reset}>
          再試行
        </Button>
        <Link
          href="/"
          className="border-border bg-background hover:bg-muted focus-visible:border-ring focus-visible:ring-ring/50 inline-flex h-8 items-center justify-center rounded-lg border px-3 text-sm font-medium outline-none focus-visible:ring-3"
        >
          タイムラインへ戻る
        </Link>
      </div>
    </section>
  );
}
