import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { LoginForm } from "@/features/auth/components/login-form";

const signInWithOtp = vi.fn();

vi.mock("@/lib/supabase/browser", () => ({
  createSupabaseBrowserClient: () => ({
    auth: {
      signInWithOtp,
    },
  }),
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

beforeEach(() => {
  signInWithOtp.mockResolvedValue({ error: null });
});

describe("LoginForm", () => {
  it("shows validation error for empty email without calling Supabase", async () => {
    const user = userEvent.setup();
    render(<LoginForm />);

    await user.click(
      screen.getByRole("button", { name: "ログインリンクを送る" }),
    );

    expect(
      await screen.findByText("メールアドレスを入力してください"),
    ).toBeInTheDocument();
    expect(signInWithOtp).not.toHaveBeenCalled();
  });

  it("shows validation error for invalid email", async () => {
    const user = userEvent.setup();
    render(<LoginForm />);

    await user.type(screen.getByLabelText("メールアドレス"), "not-an-email");
    await user.click(
      screen.getByRole("button", { name: "ログインリンクを送る" }),
    );

    expect(
      await screen.findByText("有効なメールアドレスを入力してください"),
    ).toBeInTheDocument();
    expect(signInWithOtp).not.toHaveBeenCalled();
  });

  it("sends a magic link and shows the confirmation message", async () => {
    const user = userEvent.setup();
    render(<LoginForm nextPath="/posts/abc" />);

    await user.type(screen.getByLabelText("メールアドレス"), "you@example.com");
    await user.click(
      screen.getByRole("button", { name: "ログインリンクを送る" }),
    );

    await waitFor(() => {
      expect(signInWithOtp).toHaveBeenCalledTimes(1);
    });

    expect(signInWithOtp).toHaveBeenCalledWith({
      email: "you@example.com",
      options: {
        emailRedirectTo: expect.stringContaining("/auth/callback"),
        shouldCreateUser: true,
      },
    });

    const redirectTo = signInWithOtp.mock.calls[0]?.[0]?.options
      ?.emailRedirectTo as string;
    expect(redirectTo).toContain("next=%2Fposts%2Fabc");

    expect(
      await screen.findByText(
        "you@example.com にログインリンクを送信しました。メール内のリンクを開いてください。",
      ),
    ).toBeInTheDocument();
  });

  it("keeps the form and shows a safe error when Supabase fails", async () => {
    signInWithOtp.mockResolvedValue({
      error: { message: "rate limited" },
    });
    const user = userEvent.setup();
    render(<LoginForm />);

    await user.type(screen.getByLabelText("メールアドレス"), "you@example.com");
    await user.click(
      screen.getByRole("button", { name: "ログインリンクを送る" }),
    );

    expect(
      await screen.findByText(
        "ログインリンクの送信に失敗しました。しばらくしてから再度お試しください。",
      ),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("メールアドレス")).toHaveValue(
      "you@example.com",
    );
    expect(
      screen.getByRole("button", { name: "ログインリンクを送る" }),
    ).toBeEnabled();
  });
});
