import { cleanup, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { PostList } from "@/features/posts/components/post-list";
import type { Account } from "@/types/account";
import type { TimelinePost } from "@/types/post";

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
  handle: "sendo-ai",
  displayName: "メンターAI「センドウ」",
  bio: "API・DB・設計の相談役。聞かれたら丁寧に教える",
  accountType: "ai",
  personaKey: "backend",
  avatarPath: "/avatars/sendo-ai.png",
};

const aiAccounts: readonly Account[] = [backendAi];

const posts: readonly TimelinePost[] = [
  {
    id: "11111111-1111-4111-8111-111111111111",
    content: "最初の投稿",
    createdAt: "2026-07-18T10:00:00.000Z",
    parentPostId: null,
    author: humanAuthor,
    replyCount: 1,
  },
  {
    id: "33333333-3333-4333-8333-333333333333",
    content: "ふたつ目",
    createdAt: "2026-07-18T09:00:00.000Z",
    parentPostId: null,
    author: humanAuthor,
    replyCount: 0,
  },
];

describe("PostList", () => {
  it("renders an empty state when there are no posts", () => {
    render(<PostList posts={[]} aiAccounts={aiAccounts} />);

    expect(screen.getByRole("status")).toHaveTextContent(
      "まだ投稿がありません",
    );
    expect(
      screen.getByText(
        "最初の投稿を書いて、AI社員にメンションしてみましょう。",
      ),
    ).toBeInTheDocument();
  });

  it("renders a PostCard for each timeline post", () => {
    render(<PostList posts={posts} aiAccounts={aiAccounts} />);

    expect(screen.getByText("最初の投稿")).toBeInTheDocument();
    expect(screen.getByText("ふたつ目")).toBeInTheDocument();
    expect(
      screen.getAllByRole("link", { name: "@youの投稿の返信を表示" }),
    ).toHaveLength(2);
  });
});
