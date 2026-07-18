import { cleanup, render, screen, within } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { Thread } from "@/features/posts/components/thread";
import type { Account } from "@/types/account";
import type { Post } from "@/types/post";

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...props
  }: {
    children: ReactNode;
    href: string;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

afterEach(() => {
  cleanup();
});

const humanAuthor: Account = {
  id: "00000000-0000-4000-8000-000000000001",
  handle: "you",
  displayName: "あなた",
  bio: "AI社員と一緒に働く人",
  accountType: "human",
  personaKey: null,
  avatarPath: "/avatars/you.png",
};

const backendAi: Account = {
  id: "00000000-0000-4000-8000-000000000101",
  handle: "backend-ai",
  displayName: "Backend AI「バッキー」",
  bio: "API・DB・セキュリティ担当",
  accountType: "ai",
  personaKey: "backend",
  avatarPath: "/avatars/backend-ai.png",
};

const reviewerAi: Account = {
  id: "00000000-0000-4000-8000-000000000102",
  handle: "reviewer-ai",
  displayName: "Reviewer AI「レビィ」",
  bio: "レビュー担当",
  accountType: "ai",
  personaKey: "reviewer",
  avatarPath: "/avatars/reviewer-ai.png",
};

const aiAccounts: readonly Account[] = [backendAi, reviewerAi];

const rootPost: Post = {
  id: "11111111-1111-4111-8111-111111111111",
  content: "@backend-ai 確認をお願いします",
  createdAt: "2026-07-18T10:00:00.000Z",
  parentPostId: null,
  author: humanAuthor,
};

const firstReply: Post = {
  id: "22222222-2222-4222-8222-222222222222",
  content: "前提を確認しました。",
  createdAt: "2026-07-18T10:05:00.000Z",
  parentPostId: rootPost.id,
  author: backendAi,
};

const secondReply: Post = {
  id: "33333333-3333-4333-8333-333333333333",
  content: "レビュー観点を追加します。",
  createdAt: "2026-07-18T10:10:00.000Z",
  parentPostId: rootPost.id,
  author: reviewerAi,
};

describe("Thread", () => {
  it("emphasizes the root post and lists replies in chronological order", () => {
    render(
      <Thread
        root={rootPost}
        replies={[firstReply, secondReply]}
        aiAccounts={aiAccounts}
      />,
    );

    expect(screen.getByText("元の投稿")).toBeInTheDocument();
    expect(screen.getByText("あなた")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "返信 2件" }),
    ).toBeInTheDocument();

    const replyList = screen.getByRole("list");
    const replyItems = within(replyList).getAllByRole("listitem");
    expect(replyItems).toHaveLength(2);
    expect(replyItems[0]).toHaveTextContent("前提を確認しました。");
    expect(replyItems[1]).toHaveTextContent("レビュー観点を追加します。");
    expect(replyItems[0]).toHaveTextContent("AI");
  });

  it("shows an empty state when there are no replies", () => {
    render(<Thread root={rootPost} replies={[]} aiAccounts={aiAccounts} />);

    expect(
      screen.getByRole("heading", { name: "返信 0件" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent(
      "まだ返信はありません",
    );
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
  });

  it("reuses PostCard for root and replies without custom thread cards", () => {
    const { container } = render(
      <Thread root={rootPost} replies={[firstReply]} aiAccounts={aiAccounts} />,
    );

    const cards = container.querySelectorAll("[data-slot='card']");
    expect(cards).toHaveLength(2);
    expect(cards[0]?.className).toMatch(/ring-2/);
    expect(
      screen.getByRole("heading", { name: "返信 1件" }),
    ).toBeInTheDocument();
  });
});
