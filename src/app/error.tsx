"use client";

import { useEffect } from "react";

import { Button } from "@/components/ui/button";

type HomeErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function HomeError({ error, reset }: HomeErrorProps) {
  useEffect(() => {
    // digest only — never log stack, SQL, or post body from the thrown error.
    console.error("Timeline page failed", { digest: error.digest });
  }, [error.digest]);

  return (
    <section
      aria-labelledby="timeline-error-heading"
      className="border-border bg-card space-y-4 rounded-xl border px-4 py-10 text-center"
      role="alert"
    >
      <div className="space-y-2">
        <h1
          id="timeline-error-heading"
          className="text-foreground text-lg font-semibold tracking-tight"
        >
          タイムラインを表示できません
        </h1>
        <p className="text-muted-foreground text-sm">
          一時的な問題が発生した可能性があります。しばらくしてから再試行してください。
        </p>
      </div>

      <Button type="button" onClick={reset}>
        再試行
      </Button>
    </section>
  );
}
