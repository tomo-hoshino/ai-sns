import { describe, expect, it } from "vitest";

import {
  getCreatePostErrorToast,
  getCreatePostSuccessToasts,
} from "@/features/posts/utils/create-post-toasts";

describe("getCreatePostSuccessToasts", () => {
  it("maps not_requested to a single success toast", () => {
    expect(
      getCreatePostSuccessToasts({
        aiReplyStatus: "not_requested",
        failedAi: [],
      }),
    ).toEqual([{ tone: "success", message: "投稿しました。" }]);
  });

  it("maps completed to a success toast that mentions AI replies", () => {
    expect(
      getCreatePostSuccessToasts({
        aiReplyStatus: "completed",
        failedAi: [],
      }),
    ).toEqual([
      {
        tone: "success",
        message: "投稿しました。AIからの返信が届きました。",
      },
    ]);
  });

  it("maps partial to success plus a warning with failed handles", () => {
    expect(
      getCreatePostSuccessToasts({
        aiReplyStatus: "partial",
        failedAi: [{ handle: "sendo-ai", code: "GENERATION_FAILED" }],
      }),
    ).toEqual([
      { tone: "success", message: "投稿しました。" },
      {
        tone: "warning",
        message: "一部のAI返信に失敗しました（@sendo-ai）。",
      },
    ]);
  });

  it("maps failed to success plus a warning that the post was kept", () => {
    expect(
      getCreatePostSuccessToasts({
        aiReplyStatus: "failed",
        failedAi: [{ handle: "hiyori-ai", code: "REPLY_SAVE_FAILED" }],
      }),
    ).toEqual([
      { tone: "success", message: "投稿しました。" },
      {
        tone: "warning",
        message: "AI返信の生成に失敗しました。投稿は保存されています。",
      },
    ]);
  });

  it("maps disabled to success plus an info toast", () => {
    expect(
      getCreatePostSuccessToasts({
        aiReplyStatus: "disabled",
        failedAi: [],
      }),
    ).toEqual([
      { tone: "success", message: "投稿しました。" },
      {
        tone: "info",
        message: "AI返信は現在無効です。投稿のみ保存しました。",
      },
    ]);
  });
});

describe("getCreatePostErrorToast", () => {
  it("uses the provided safe API message", () => {
    expect(getCreatePostErrorToast("投稿内容を入力してください。")).toEqual({
      tone: "error",
      message: "投稿内容を入力してください。",
    });
  });

  it("falls back when the message is blank", () => {
    expect(getCreatePostErrorToast("   ")).toEqual({
      tone: "error",
      message: "投稿に失敗しました。時間をおいて再試行してください。",
    });
  });
});
