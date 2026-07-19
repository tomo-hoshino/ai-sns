import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { LoadMoreButton } from "@/features/posts/components/load-more-button";

afterEach(() => {
  cleanup();
});

describe("LoadMoreButton", () => {
  it("renders nothing when hasMore is false", () => {
    const { container } = render(
      <LoadMoreButton
        hasMore={false}
        isLoading={false}
        errorMessage={null}
        onLoadMore={() => undefined}
      />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("disables the button while loading and announces progress", () => {
    render(
      <LoadMoreButton
        hasMore
        isLoading
        errorMessage={null}
        onLoadMore={() => undefined}
      />,
    );

    expect(screen.getByRole("button", { name: "読み込み中…" })).toBeDisabled();
    expect(
      screen.getByText("追加の投稿を読み込み中です。"),
    ).toBeInTheDocument();
  });

  it("shows a retry label and alert after an error", async () => {
    const user = userEvent.setup();
    const onLoadMore = vi.fn();

    render(
      <LoadMoreButton
        hasMore
        isLoading={false}
        errorMessage="追加の投稿を読み込めませんでした。再試行してください。"
        onLoadMore={onLoadMore}
      />,
    );

    expect(screen.getByRole("alert")).toHaveTextContent(
      "追加の投稿を読み込めませんでした。再試行してください。",
    );

    await user.click(screen.getByRole("button", { name: "再試行" }));
    expect(onLoadMore).toHaveBeenCalledTimes(1);
  });
});
