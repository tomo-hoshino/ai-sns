import { cleanup, render, screen, within } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { PostCard } from "@/features/posts/components/post-card";
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
  handle: "guest",
  displayName: "Guest",
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

const humanPost: Post = {
  id: "11111111-1111-4111-8111-111111111111",
  content: "@sendo-ai と @unknown-ai を確認して",
  createdAt: "2026-07-18T10:00:00.000Z",
  parentPostId: null,
  author: humanAuthor,
};

const aiReplyPost: Post = {
  id: "22222222-2222-4222-8222-222222222222",
  content: "前提を確認しました。",
  createdAt: "2026-07-18T10:05:00.000Z",
  parentPostId: humanPost.id,
  author: backendAi,
};

describe("PostCard", () => {
  it("renders author, handle, relative time with ISO dateTime, and content", () => {
    render(
      <PostCard post={humanPost} aiAccounts={aiAccounts} replyCount={2} />,
    );

    expect(screen.getByText("Guest")).toBeInTheDocument();
    expect(screen.getByText("@guest")).toBeInTheDocument();
    expect(screen.getByText("返信 2件")).toBeInTheDocument();

    const time = screen.getByText(/前$/);
    expect(time.tagName).toBe("TIME");
    expect(time).toHaveAttribute("dateTime", humanPost.createdAt);

    expect(
      screen.getByRole("link", { name: "@guestの投稿の返信を表示" }),
    ).toHaveAttribute("href", `/posts/${humanPost.id}`);
  });

  it("links avatar, display name, and handle to the author profile", () => {
    render(
      <PostCard post={humanPost} aiAccounts={aiAccounts} replyCount={0} />,
    );

    const profileHref = `/profiles/${humanAuthor.handle}`;
    const profileLinks = screen.getAllByRole("link", {
      name: "Guest（@guest）のプロフィール",
    });
    expect(profileLinks.length).toBeGreaterThanOrEqual(1);
    for (const link of profileLinks) {
      expect(link).toHaveAttribute("href", profileHref);
    }

    expect(screen.getByRole("link", { name: "Guest" })).toHaveAttribute(
      "href",
      profileHref,
    );
    expect(screen.getByRole("link", { name: "@guest" })).toHaveAttribute(
      "href",
      profileHref,
    );
  });

  it("links AI author identity to the AI profile", () => {
    render(
      <PostCard post={aiReplyPost} aiAccounts={aiAccounts} replyCount={0} />,
    );

    const profileHref = `/profiles/${backendAi.handle}`;

    expect(
      screen.getByRole("link", {
        name: "メンターAI「センドウ」（@sendo-ai）のプロフィール",
      }),
    ).toHaveAttribute("href", profileHref);
    expect(
      screen.getByRole("link", { name: "メンターAI「センドウ」" }),
    ).toHaveAttribute("href", profileHref);
    expect(screen.getByRole("link", { name: "@sendo-ai" })).toHaveAttribute(
      "href",
      profileHref,
    );
  });

  it("does not show an AI badge for human authors", () => {
    render(
      <PostCard post={humanPost} aiAccounts={aiAccounts} replyCount={0} />,
    );

    expect(screen.queryByText("AI")).not.toBeInTheDocument();
  });

  it("shows an AI badge and accent for AI authors", () => {
    const { container } = render(
      <PostCard post={aiReplyPost} aiAccounts={aiAccounts} replyCount={0} />,
    );

    expect(screen.getByText("AI")).toBeInTheDocument();
    expect(container.querySelector("[data-slot='card']")?.className).toMatch(
      /border-l-ai-backend/,
    );
    expect(
      screen.getByRole("link", { name: "@sendo-aiの投稿の返信を表示" }),
    ).toHaveAttribute("href", `/posts/${humanPost.id}`);
  });

  it("highlights only valid AI mentions as React text", () => {
    const { container } = render(
      <PostCard post={humanPost} aiAccounts={aiAccounts} replyCount={1} />,
    );

    expect(container.innerHTML).not.toContain("dangerouslySetInnerHTML");

    const content = container.querySelector("p");
    expect(content).not.toBeNull();
    if (content === null) {
      return;
    }

    const mention = within(content).getByText("@sendo-ai");
    expect(mention.className).toMatch(/text-ai-backend/);
    expect(content).toHaveTextContent("@unknown-ai");
    expect(
      within(content).queryByText("@unknown-ai", { exact: true }),
    ).not.toBeInTheDocument();
  });
});
