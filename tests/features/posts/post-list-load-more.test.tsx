import {
  cleanup,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { PostList } from "@/features/posts/components/post-list";
import type { Account } from "@/types/account";
import type { ListPostsResponse } from "@/types/api";
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

const humanAuthor: Account = {
  id: "00000000-0000-4000-8000-000000000001",
  handle: "guest",
  displayName: "Guest",
  bio: "AI社員と一緒に働く人",
  accountType: "human",
  personaKey: null,
  avatarPath: "/avatars/you.png",
};

const aiAccounts: readonly Account[] = [];

const initialPost: TimelinePost = {
  id: "11111111-1111-4111-8111-111111111111",
  content: "最初の投稿",
  createdAt: "2026-07-18T10:00:00.000Z",
  parentPostId: null,
  author: humanAuthor,
  replyCount: 0,
};

const nextPagePost: TimelinePost = {
  id: "22222222-2222-4222-8222-222222222222",
  content: "次のページ",
  createdAt: "2026-07-18T09:00:00.000Z",
  parentPostId: null,
  author: humanAuthor,
  replyCount: 0,
};

const opaqueCursor =
  "eyJjcmVhdGVkQXQiOiIyMDI2LTA3LTE4VDEwOjAwOjAwLjAwMFoiLCJpZCI6IjExMTExMTExLTExMTEtNDExMS04MTExLTExMTExMTExMTExMSJ9";

function createListResponse(
  data: TimelinePost[],
  page: ListPostsResponse["page"],
): ListPostsResponse {
  return { data, page };
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn());
});

describe("PostList load more", () => {
  it("hides the load more button when hasMore is false", () => {
    render(
      <PostList
        posts={[initialPost]}
        aiAccounts={aiAccounts}
        initialNextCursor={null}
        initialHasMore={false}
      />,
    );

    expect(
      screen.queryByRole("button", { name: "さらに読み込む" }),
    ).not.toBeInTheDocument();
  });

  it("passes the opaque cursor unchanged and appends the next page", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify(
          createListResponse([nextPagePost], {
            nextCursor: null,
            hasMore: false,
          }),
        ),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      ),
    );

    render(
      <PostList
        posts={[initialPost]}
        aiAccounts={aiAccounts}
        initialNextCursor={opaqueCursor}
        initialHasMore
      />,
    );

    await user.click(screen.getByRole("button", { name: "さらに読み込む" }));

    await waitFor(() => {
      expect(screen.getByText("次のページ")).toBeInTheDocument();
    });
    expect(screen.getByText("最初の投稿")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "さらに読み込む" }),
    ).not.toBeInTheDocument();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const requestUrl = String(fetchMock.mock.calls[0]?.[0]);
    const parsedUrl = new URL(requestUrl, "http://localhost");
    expect(parsedUrl.pathname).toBe("/api/posts");
    expect(parsedUrl.searchParams.get("cursor")).toBe(opaqueCursor);
    expect(parsedUrl.searchParams.get("limit")).toBe("20");
  });

  it("does not start a second request while loading", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.mocked(fetch);
    let resolveFetch: ((value: Response) => void) | undefined;
    fetchMock.mockImplementation(
      () =>
        new Promise<Response>((resolve) => {
          resolveFetch = resolve;
        }),
    );

    render(
      <PostList
        posts={[initialPost]}
        aiAccounts={aiAccounts}
        initialNextCursor={opaqueCursor}
        initialHasMore
      />,
    );

    const button = screen.getByRole("button", { name: "さらに読み込む" });
    await user.click(button);
    await user.click(screen.getByRole("button", { name: "読み込み中…" }));

    expect(fetchMock).toHaveBeenCalledTimes(1);

    resolveFetch?.(
      new Response(
        JSON.stringify(
          createListResponse([nextPagePost], {
            nextCursor: null,
            hasMore: false,
          }),
        ),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      ),
    );

    await waitFor(() => {
      expect(screen.getByText("次のページ")).toBeInTheDocument();
    });
  });

  it("keeps existing posts and allows retry after a failed request", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.mocked(fetch);
    fetchMock
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            error: {
              code: "DATABASE_ERROR",
              message: "データベースエラーが発生しました。",
            },
            requestId: "7b0883a1-6b0f-4da8-b66d-ad270f5634cd",
          }),
          {
            status: 500,
            headers: { "Content-Type": "application/json" },
          },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify(
            createListResponse([nextPagePost], {
              nextCursor: null,
              hasMore: false,
            }),
          ),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          },
        ),
      );

    render(
      <PostList
        posts={[initialPost]}
        aiAccounts={aiAccounts}
        initialNextCursor={opaqueCursor}
        initialHasMore
      />,
    );

    await user.click(screen.getByRole("button", { name: "さらに読み込む" }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeInTheDocument();
    });
    expect(screen.getByText("最初の投稿")).toBeInTheDocument();
    expect(screen.queryByText("次のページ")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "再試行" }));

    await waitFor(() => {
      expect(screen.getByText("次のページ")).toBeInTheDocument();
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("does not render duplicate posts when the next page repeats an id", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify(
          createListResponse([initialPost, nextPagePost], {
            nextCursor: null,
            hasMore: false,
          }),
        ),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      ),
    );

    render(
      <PostList
        posts={[initialPost]}
        aiAccounts={aiAccounts}
        initialNextCursor={opaqueCursor}
        initialHasMore
      />,
    );

    await user.click(screen.getByRole("button", { name: "さらに読み込む" }));

    await waitFor(() => {
      expect(screen.getByText("次のページ")).toBeInTheDocument();
    });

    const list = screen.getByRole("list");
    expect(within(list).getAllByText("最初の投稿")).toHaveLength(1);
  });
});
