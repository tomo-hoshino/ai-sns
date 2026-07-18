"use client";

import { Button } from "@/components/ui/button";

export type LoadMoreButtonProps = {
  hasMore: boolean;
  isLoading: boolean;
  errorMessage: string | null;
  onLoadMore: () => void;
};

export function LoadMoreButton({
  hasMore,
  isLoading,
  errorMessage,
  onLoadMore,
}: LoadMoreButtonProps) {
  if (!hasMore) {
    return null;
  }

  const label = errorMessage !== null ? "再試行" : "さらに読み込む";

  return (
    <div className="flex flex-col items-center gap-2 pt-1">
      {errorMessage !== null ? (
        <p role="alert" className="text-destructive text-sm">
          {errorMessage}
        </p>
      ) : null}
      <Button
        type="button"
        variant="outline"
        size="lg"
        className="w-full max-w-xs"
        disabled={isLoading}
        aria-busy={isLoading}
        onClick={onLoadMore}
      >
        {isLoading ? "読み込み中…" : label}
      </Button>
    </div>
  );
}
