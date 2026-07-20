import { cleanup, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { Header } from "@/components/layout/header";

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

vi.mock("@/features/auth/components/header-auth", () => ({
  HeaderAuth: () => <a href="/login">ログイン</a>,
}));

afterEach(() => {
  cleanup();
});

describe("Header", () => {
  it("links to the about page and keeps the home and login paths", async () => {
    render(await Header());

    expect(screen.getByRole("link", { name: "AI Office SNS" })).toHaveAttribute(
      "href",
      "/",
    );
    expect(
      screen.getByRole("link", { name: "このシステムについて" }),
    ).toHaveAttribute("href", "/about");
    expect(screen.getByRole("link", { name: "ログイン" })).toHaveAttribute(
      "href",
      "/login",
    );
  });
});
