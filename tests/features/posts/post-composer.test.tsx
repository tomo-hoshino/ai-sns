import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { getAiMentionAccessibleName } from "@/features/posts/components/ai-mention-list";
import { PostComposer } from "@/features/posts/components/post-composer";
import { countUnicodeCodePoints } from "@/lib/validations/common";
import type { Account } from "@/types/account";
import type { CreatePostResponse } from "@/types/api";

const refreshMock = vi.fn();
const toastSuccess = vi.fn();
const toastWarning = vi.fn();
const toastMessage = vi.fn();
const toastError = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: refreshMock,
  }),
}));

vi.mock("sonner", () => ({
  toast: {
    success: (...args: unknown[]) => toastSuccess(...args),
    warning: (...args: unknown[]) => toastWarning(...args),
    message: (...args: unknown[]) => toastMessage(...args),
    error: (...args: unknown[]) => toastError(...args),
  },
}));

const aiAccounts: readonly Account[] = [
  {
    id: "00000000-0000-4000-8000-000000000101",
    handle: "sendo-ai",
    displayName: "メンターAI「センドウ」",
    bio: "API・DB・設計の相談役。聞かれたら丁寧に教える",
    accountType: "ai",
    personaKey: "backend",
    avatarPath: "/avatars/sendo-ai.png",
  },
  {
    id: "00000000-0000-4000-8000-000000000102",
    handle: "sora-ai",
    displayName: "気ままAI「ソラ」",
    bio: "UIと体験を自由に組み立てる。縛りが少ないほど本領を発揮する",
    accountType: "ai",
    personaKey: "frontend",
    avatarPath: "/avatars/sora-ai.png",
  },
];

const humanAuthor: Account = {
  id: "00000000-0000-4000-8000-000000000001",
  handle: "you",
  displayName: "あなた",
  bio: "AI社員と一緒に働く人",
  accountType: "human",
  personaKey: null,
  avatarPath: "/avatars/you.png",
};

function createSuccessResponse(
  meta: CreatePostResponse["meta"],
): CreatePostResponse {
  return {
    data: {
      post: {
        id: "a4e87a1b-989e-46e7-baa2-57d170f86afe",
        content: "hello",
        createdAt: "2026-07-18T04:10:30.000Z",
        parentPostId: null,
        author: humanAuthor,
      },
      aiReplies: [],
    },
    meta,
    requestId: "760605b5-602a-44ab-a679-ae682de3ea83",
  };
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  refreshMock.mockReset();
  toastSuccess.mockReset();
  toastWarning.mockReset();
  toastMessage.mockReset();
  toastError.mockReset();
});

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn());
});

describe("PostComposer character limits", () => {
  it("keeps submit disabled for 0 characters", () => {
    render(<PostComposer aiAccounts={aiAccounts} />);

    expect(screen.getByRole("button", { name: "投稿する" })).toBeDisabled();
    expect(screen.getByLabelText("新しい投稿")).toHaveValue("");
    expect(screen.getByText("残り 300 / 300 文字")).toBeInTheDocument();
  });

  it("enables submit for 1 character and posts successfully", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify(
          createSuccessResponse({
            aiReplyStatus: "not_requested",
            mentionedAiHandles: [],
            succeededAiHandles: [],
            failedAi: [],
          }),
        ),
        { status: 201, headers: { "Content-Type": "application/json" } },
      ),
    );

    render(<PostComposer aiAccounts={aiAccounts} />);

    const textarea = screen.getByLabelText("新しい投稿");
    await user.type(textarea, "あ");

    expect(screen.getByText("残り 299 / 300 文字")).toBeInTheDocument();
    const submit = screen.getByRole("button", { name: "投稿する" });
    expect(submit).toBeEnabled();

    await user.click(submit);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });
    expect(fetchMock.mock.calls[0]?.[0]).toBe("/api/posts");
    expect(toastSuccess).toHaveBeenCalledWith("投稿しました。");
    expect(refreshMock).toHaveBeenCalledTimes(1);
    expect(textarea).toHaveValue("");
    expect(screen.getByText("投稿しました。")).toBeInTheDocument();
  });

  it("allows exactly 300 characters", async () => {
    const user = userEvent.setup();
    render(<PostComposer aiAccounts={aiAccounts} />);

    const content = "あ".repeat(300);
    const textarea = screen.getByLabelText("新しい投稿");
    await user.click(textarea);
    await user.paste(content);

    expect(textarea).toHaveValue(content);
    expect(
      countUnicodeCodePoints((textarea as HTMLTextAreaElement).value),
    ).toBe(300);
    expect(screen.getByText("残り 0 / 300 文字")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "投稿する" })).toBeEnabled();
  });

  it("prevents 301 characters by clamping input", async () => {
    const user = userEvent.setup();
    render(<PostComposer aiAccounts={aiAccounts} />);

    const textarea = screen.getByLabelText("新しい投稿");
    await user.click(textarea);
    await user.paste("あ".repeat(301));

    expect(
      countUnicodeCodePoints((textarea as HTMLTextAreaElement).value),
    ).toBe(300);
    expect(screen.getByText("残り 0 / 300 文字")).toBeInTheDocument();
  });
});

describe("PostComposer mentions and API outcomes", () => {
  it("inserts a mention at the cursor without destroying existing text", async () => {
    const user = userEvent.setup();
    render(<PostComposer aiAccounts={aiAccounts} />);

    const textarea = screen.getByLabelText("新しい投稿") as HTMLTextAreaElement;
    await user.type(textarea, "確認お願いします");
    textarea.setSelectionRange(0, 0);

    await user.click(
      screen.getByRole("button", {
        name: getAiMentionAccessibleName(aiAccounts[0]),
      }),
    );

    expect(textarea.value).toBe("@sendo-ai 確認お願いします");
  });

  it("keeps input on API failure and shows a safe error message", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          error: {
            code: "DATABASE_ERROR",
            message: "投稿の保存に失敗しました。",
          },
          requestId: "760605b5-602a-44ab-a679-ae682de3ea83",
        }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      ),
    );

    render(<PostComposer aiAccounts={aiAccounts} />);

    const textarea = screen.getByLabelText("新しい投稿");
    await user.type(textarea, "保存してほしい本文");
    await user.click(screen.getByRole("button", { name: "投稿する" }));

    await waitFor(() => {
      expect(toastError).toHaveBeenCalledWith("投稿の保存に失敗しました。");
    });
    expect(textarea).toHaveValue("保存してほしい本文");
    expect(refreshMock).not.toHaveBeenCalled();
    expect(screen.getByText("投稿の保存に失敗しました。")).toBeInTheDocument();
  });

  it("notifies completed AI replies after a 201 response", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify(
          createSuccessResponse({
            aiReplyStatus: "completed",
            mentionedAiHandles: ["sendo-ai"],
            succeededAiHandles: ["sendo-ai"],
            failedAi: [],
          }),
        ),
        { status: 201, headers: { "Content-Type": "application/json" } },
      ),
    );

    render(<PostComposer aiAccounts={aiAccounts} />);
    await user.type(screen.getByLabelText("新しい投稿"), "完了テスト");
    await user.click(screen.getByRole("button", { name: "投稿する" }));

    await waitFor(() => {
      expect(toastSuccess).toHaveBeenCalledWith(
        "投稿しました。AIからの返信が届きました。",
      );
    });
    expect(toastWarning).not.toHaveBeenCalled();
    expect(refreshMock).toHaveBeenCalledTimes(1);
  });

  it("notifies partial AI reply failures after a 201 response", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify(
          createSuccessResponse({
            aiReplyStatus: "partial",
            mentionedAiHandles: ["sendo-ai", "sora-ai"],
            succeededAiHandles: ["sora-ai"],
            failedAi: [{ handle: "sendo-ai", code: "GENERATION_FAILED" }],
          }),
        ),
        { status: 201, headers: { "Content-Type": "application/json" } },
      ),
    );

    render(<PostComposer aiAccounts={aiAccounts} />);
    await user.type(screen.getByLabelText("新しい投稿"), "部分失敗テスト");
    await user.click(screen.getByRole("button", { name: "投稿する" }));

    await waitFor(() => {
      expect(toastSuccess).toHaveBeenCalledWith("投稿しました。");
      expect(toastWarning).toHaveBeenCalledWith(
        "一部のAI返信に失敗しました（@sendo-ai）。",
      );
    });
    expect(refreshMock).toHaveBeenCalledTimes(1);
  });

  it("notifies failed and disabled AI reply statuses", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.mocked(fetch);

    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify(
          createSuccessResponse({
            aiReplyStatus: "failed",
            mentionedAiHandles: ["sendo-ai"],
            succeededAiHandles: [],
            failedAi: [{ handle: "sendo-ai", code: "GENERATION_FAILED" }],
          }),
        ),
        { status: 201, headers: { "Content-Type": "application/json" } },
      ),
    );

    const { unmount } = render(<PostComposer aiAccounts={aiAccounts} />);
    await user.type(screen.getByLabelText("新しい投稿"), "全失敗");
    await user.click(screen.getByRole("button", { name: "投稿する" }));

    await waitFor(() => {
      expect(toastWarning).toHaveBeenCalledWith(
        "AI返信の生成に失敗しました。投稿は保存されています。",
      );
    });
    unmount();

    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify(
          createSuccessResponse({
            aiReplyStatus: "disabled",
            mentionedAiHandles: ["sendo-ai"],
            succeededAiHandles: [],
            failedAi: [],
          }),
        ),
        { status: 201, headers: { "Content-Type": "application/json" } },
      ),
    );

    render(<PostComposer aiAccounts={aiAccounts} />);
    await user.type(screen.getByLabelText("新しい投稿"), "無効");
    await user.click(screen.getByRole("button", { name: "投稿する" }));

    await waitFor(() => {
      expect(toastMessage).toHaveBeenCalledWith(
        "AI返信は現在無効です。投稿のみ保存しました。",
      );
    });
  });

  it("disables the form controls while submitting to prevent double submit", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.mocked(fetch);
    let resolveFetch: ((value: Response) => void) | undefined;
    fetchMock.mockImplementation(
      () =>
        new Promise<Response>((resolve) => {
          resolveFetch = resolve;
        }),
    );

    render(<PostComposer aiAccounts={aiAccounts} />);
    await user.type(screen.getByLabelText("新しい投稿"), "二重送信防止");
    await user.click(screen.getByRole("button", { name: "投稿する" }));

    expect(screen.getByRole("button", { name: "投稿中…" })).toBeDisabled();
    expect(screen.getByLabelText("新しい投稿")).toBeDisabled();
    expect(
      screen.getByRole("button", {
        name: getAiMentionAccessibleName(aiAccounts[0]),
      }),
    ).toBeDisabled();
    expect(screen.getByText("投稿を送信しています。")).toBeInTheDocument();

    resolveFetch?.(
      new Response(
        JSON.stringify(
          createSuccessResponse({
            aiReplyStatus: "not_requested",
            mentionedAiHandles: [],
            succeededAiHandles: [],
            failedAi: [],
          }),
        ),
        { status: 201, headers: { "Content-Type": "application/json" } },
      ),
    );

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(refreshMock).toHaveBeenCalledTimes(1);
    });
  });
});
