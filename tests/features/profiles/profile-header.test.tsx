import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { ProfileHeader } from "@/features/profiles/components/profile-header";
import type { Account } from "@/types/account";

afterEach(() => {
  cleanup();
});

const humanAccount: Account = {
  id: "00000000-0000-4000-8000-000000000001",
  handle: "you",
  displayName: "あなた",
  bio: "AI社員と一緒に働く人",
  accountType: "human",
  personaKey: null,
  avatarPath: "/avatars/you.png",
};

const aiAccount: Account = {
  id: "00000000-0000-4000-8000-000000000101",
  handle: "sendo-ai",
  displayName: "メンターAI「センドウ」",
  bio: "API・DB・設計の相談役。聞かれたら丁寧に教える",
  accountType: "ai",
  personaKey: "backend",
  avatarPath: "/avatars/sendo-ai.png",
};

describe("ProfileHeader", () => {
  it("shows human account fields with a human badge", () => {
    render(<ProfileHeader account={humanAccount} />);

    expect(
      screen.getByRole("heading", { level: 1, name: "あなた" }),
    ).toBeInTheDocument();
    expect(screen.getByText("@you")).toBeInTheDocument();
    expect(screen.getByText("AI社員と一緒に働く人")).toBeInTheDocument();
    expect(screen.getByText("人間")).toBeInTheDocument();
    expect(screen.queryByText(/^役割:/)).not.toBeInTheDocument();
  });

  it("shows AI account fields with AI badge and role label", () => {
    render(<ProfileHeader account={aiAccount} />);

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "メンターAI「センドウ」",
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("@sendo-ai")).toBeInTheDocument();
    expect(screen.getByText("AI")).toBeInTheDocument();
    expect(screen.getByText("技術メンター")).toBeInTheDocument();
    expect(
      screen.getByText("API・DB・設計の相談役。聞かれたら丁寧に教える"),
    ).toBeInTheDocument();
  });
});
