"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useId,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { AiMentionList } from "@/features/posts/components/ai-mention-list";
import {
  canSubmitPostContent,
  createPostRequest,
} from "@/features/posts/hooks/create-post-request";
import { clampUnicodeText } from "@/features/posts/utils/clamp-unicode-text";
import {
  getCreatePostErrorToast,
  getCreatePostSuccessToasts,
} from "@/features/posts/utils/create-post-toasts";
import { insertMentionAtCursor } from "@/features/posts/utils/insert-mention-at-cursor";
import {
  countUnicodeCodePoints,
  MAX_POST_LENGTH,
} from "@/lib/validations/common";
import type { Account } from "@/types/account";

export type PostComposerProps = {
  aiAccounts: readonly Account[];
  /** When false, posts are authored as shared Guest (`@guest`). */
  isLoggedIn: boolean;
};

export function PostComposer({ aiAccounts, isLoggedIn }: PostComposerProps) {
  const router = useRouter();
  const textareaId = useId();
  const counterId = useId();
  const statusId = useId();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isSubmittingRef = useRef(false);

  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationMessage, setValidationMessage] = useState<string | null>(
    null,
  );
  const [statusMessage, setStatusMessage] = useState("");

  const characterCount = countUnicodeCodePoints(content);
  const remainingCount = MAX_POST_LENGTH - characterCount;
  const canSubmit = canSubmitPostContent(content) && !isSubmitting;

  function handleContentChange(event: ChangeEvent<HTMLTextAreaElement>): void {
    const next = clampUnicodeText(event.target.value, MAX_POST_LENGTH);
    setContent(next);
    if (validationMessage !== null) {
      setValidationMessage(null);
    }
  }

  function handleMentionSelect(handle: string): void {
    if (isSubmitting) {
      return;
    }

    const textarea = textareaRef.current;
    const selectionStart = textarea?.selectionStart ?? content.length;
    const selectionEnd = textarea?.selectionEnd ?? selectionStart;
    const inserted = insertMentionAtCursor({
      content,
      handle,
      selectionStart,
      selectionEnd,
    });

    setContent(inserted.content);
    setValidationMessage(null);

    queueMicrotask(() => {
      const node = textareaRef.current;
      if (node === null) {
        return;
      }
      node.focus();
      node.setSelectionRange(inserted.cursor, inserted.cursor);
    });
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault();

    if (isSubmittingRef.current) {
      return;
    }

    const trimmed = content.trim();
    if (!canSubmitPostContent(content)) {
      const message =
        countUnicodeCodePoints(trimmed) < 1
          ? "投稿内容を入力してください。"
          : "投稿は300文字以内で入力してください。";
      setValidationMessage(message);
      return;
    }

    isSubmittingRef.current = true;
    setIsSubmitting(true);
    setValidationMessage(null);
    setStatusMessage("投稿を送信しています。");

    try {
      const result = await createPostRequest(trimmed);
      if (!result.ok) {
        const errorToast = getCreatePostErrorToast(result.message);
        toast.error(errorToast.message);
        setStatusMessage(errorToast.message);
        return;
      }

      const successToasts = getCreatePostSuccessToasts(result.response.meta);
      for (const item of successToasts) {
        showToast(item.tone, item.message);
      }
      setStatusMessage(successToasts.map((item) => item.message).join(" "));
      setContent("");
      router.refresh();
    } finally {
      isSubmittingRef.current = false;
      setIsSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={(event) => {
        void handleSubmit(event);
      }}
      className="border-border bg-card space-y-3 rounded-xl border p-4"
      aria-busy={isSubmitting}
    >
      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
          <label
            htmlFor={textareaId}
            className="text-foreground text-sm font-medium"
          >
            新しい投稿
          </label>
          {!isLoggedIn ? (
            <p className="text-muted-foreground flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-xs sm:text-sm">
              <Badge variant="outline">Guest</Badge>
              <span>
                Guest（@guest）として投稿します。個人ハンドルで投稿するには
                <Link
                  href="/login"
                  className="text-foreground focus-visible:ring-ring/50 mx-1 rounded-sm underline-offset-4 outline-none hover:underline focus-visible:ring-3"
                >
                  ログイン
                </Link>
                してください。
              </span>
            </p>
          ) : null}
        </div>
        <Textarea
          ref={textareaRef}
          id={textareaId}
          name="content"
          value={content}
          onChange={handleContentChange}
          placeholder="いま考えていることを書いて、AI社員にメンションできます"
          disabled={isSubmitting}
          aria-invalid={validationMessage !== null}
          aria-describedby={
            validationMessage === null ? counterId : `${counterId} ${statusId}`
          }
          className="min-h-28 resize-y"
        />
        <div className="flex items-center justify-between gap-3">
          <p
            id={counterId}
            className={
              remainingCount <= 20
                ? "text-destructive text-xs"
                : "text-muted-foreground text-xs"
            }
            aria-live="polite"
          >
            残り {remainingCount} / {MAX_POST_LENGTH} 文字
          </p>
          <Button type="submit" disabled={!canSubmit}>
            {isSubmitting ? "投稿中…" : "投稿する"}
          </Button>
        </div>
        {validationMessage !== null ? (
          <p id={statusId} role="alert" className="text-destructive text-sm">
            {validationMessage}
          </p>
        ) : null}
      </div>

      <AiMentionList
        accounts={aiAccounts}
        onSelect={handleMentionSelect}
        disabled={isSubmitting}
      />

      <p className="sr-only" aria-live="polite" aria-atomic="true">
        {statusMessage}
      </p>
    </form>
  );
}

function showToast(
  tone: "success" | "info" | "warning" | "error",
  message: string,
): void {
  switch (tone) {
    case "success":
      toast.success(message);
      return;
    case "info":
      toast.message(message);
      return;
    case "warning":
      toast.warning(message);
      return;
    case "error":
      toast.error(message);
      return;
  }
}
