import type { AiReplyStatus, FailedAi } from "@/types/api";

export type CreatePostToastTone = "success" | "info" | "warning" | "error";

export type CreatePostToast = {
  tone: CreatePostToastTone;
  message: string;
};

export type CreatePostSuccessMeta = {
  aiReplyStatus: AiReplyStatus;
  failedAi: readonly FailedAi[];
};

/**
 * Maps a successful (201) create-post response into Sonner notifications.
 * Human post success is always announced; AI reply outcomes are separate when needed.
 */
export function getCreatePostSuccessToasts(
  meta: CreatePostSuccessMeta,
): CreatePostToast[] {
  switch (meta.aiReplyStatus) {
    case "not_requested":
      return [{ tone: "success", message: "投稿しました。" }];
    case "completed":
      return [
        {
          tone: "success",
          message: "投稿しました。AIからの返信が届きました。",
        },
      ];
    case "partial":
      return [
        { tone: "success", message: "投稿しました。" },
        {
          tone: "warning",
          message: formatPartialAiFailureMessage(meta.failedAi),
        },
      ];
    case "failed":
      return [
        { tone: "success", message: "投稿しました。" },
        {
          tone: "warning",
          message: "AI返信の生成に失敗しました。投稿は保存されています。",
        },
      ];
    case "disabled":
      return [
        { tone: "success", message: "投稿しました。" },
        {
          tone: "info",
          message: "AI返信は現在無効です。投稿のみ保存しました。",
        },
      ];
  }
}

export function getCreatePostErrorToast(message: string): CreatePostToast {
  const trimmed = message.trim();
  return {
    tone: "error",
    message:
      trimmed.length > 0
        ? trimmed
        : "投稿に失敗しました。時間をおいて再試行してください。",
  };
}

function formatPartialAiFailureMessage(failedAi: readonly FailedAi[]): string {
  const handles = failedAi.map((item) => `@${item.handle}`);
  if (handles.length === 0) {
    return "一部のAI返信に失敗しました。";
  }

  return `一部のAI返信に失敗しました（${handles.join("、")}）。`;
}
