import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import AppError from "@/app/error";
import ThreadError from "@/app/posts/[id]/error";

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

describe("error boundaries", () => {
  it("lets the user retry or return to the timeline from the app error", async () => {
    const user = userEvent.setup();
    const reset = vi.fn();

    render(
      <AppError
        error={Object.assign(new Error("boom"), { digest: "digest-1" })}
        reset={reset}
      />,
    );

    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "タイムラインへ戻る" }),
    ).toHaveAttribute("href", "/");

    await user.click(screen.getByRole("button", { name: "再試行" }));
    expect(reset).toHaveBeenCalledTimes(1);
  });

  it("lets the user retry or return to the timeline from the thread error", async () => {
    const user = userEvent.setup();
    const reset = vi.fn();

    render(
      <ThreadError
        error={Object.assign(new Error("boom"), { digest: "digest-2" })}
        reset={reset}
      />,
    );

    expect(
      screen.getByRole("heading", { name: "スレッドを表示できません" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "タイムラインへ戻る" }),
    ).toHaveAttribute("href", "/");

    await user.click(screen.getByRole("button", { name: "再試行" }));
    expect(reset).toHaveBeenCalledTimes(1);
  });
});
