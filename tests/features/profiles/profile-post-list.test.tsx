import { cleanup, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ProfilePostList } from "@/features/profiles/components/profile-post-list";
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
  handle: "guest",
  displayName: "Guest",
  bio: "AI社員と一緒に働く人",
  accountType: "human",
  personaKey: null,
  avatarPath: "/avatars/you.png",
};

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
];

const rootPost: TimelinePost = {
  id: "11111111-1111-4111-8111-111111111111",
  content: "プロフィール用のルート投稿",
  createdAt: "2026-07-18T10:00:00.000Z",
  parentPostId: null,
  author: humanAuthor,
  replyCount: 1,
};

describe("ProfilePostList", () => {
  it("shows an empty state when there are no root posts", () => {
    render(<ProfilePostList posts={[]} aiAccounts={aiAccounts} />);

    expect(screen.getByRole("status")).toHaveTextContent(
      "まだルート投稿がありません",
    );
    expect(
      screen.getByText(
        "このアカウントのルート投稿があると、ここに新着順で表示されます。",
      ),
    ).toBeInTheDocument();
  });

  it("renders root posts with reply counts", () => {
    render(<ProfilePostList posts={[rootPost]} aiAccounts={aiAccounts} />);

    expect(screen.getByText("プロフィール用のルート投稿")).toBeInTheDocument();
    expect(screen.getByText("返信 1件")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "@guestの投稿の返信を表示" }),
    ).toBeInTheDocument();
  });
});
