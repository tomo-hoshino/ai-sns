import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { ProfilePersonaDetails } from "@/features/profiles/components/profile-persona-details";

afterEach(() => {
  cleanup();
});

const details = {
  summary: "頼れる兄貴分として一緒に考える。",
  speakingStyle: "落ち着いたタメ口で話す。",
  focusPoints: [
    "迷いの核心を受け止める",
    "判断基準を伝える",
    "次に進みやすい整理をする",
  ],
} as const;

describe("ProfilePersonaDetails", () => {
  it("shows persona summary, speaking style, and focus points", () => {
    render(<ProfilePersonaDetails details={details} />);

    expect(
      screen.getByRole("heading", { level: 2, name: "キャラクター" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 3, name: "人物像" }),
    ).toBeInTheDocument();
    expect(screen.getByText(details.summary)).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 3, name: "話し方" }),
    ).toBeInTheDocument();
    expect(screen.getByText(details.speakingStyle)).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        level: 3,
        name: "こんなところを見ます",
      }),
    ).toBeInTheDocument();

    for (const point of details.focusPoints) {
      expect(screen.getByText(point)).toBeInTheDocument();
    }
  });
});
