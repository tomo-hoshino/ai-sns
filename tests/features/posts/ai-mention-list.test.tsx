import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  AiMentionList,
  getAiMentionAccessibleName,
} from "@/features/posts/components/ai-mention-list";
import type { Account } from "@/types/account";

afterEach(() => {
  cleanup();
});

const aiAccounts: readonly Account[] = [
  {
    id: "00000000-0000-4000-8000-000000000101",
    handle: "backend-ai",
    displayName: "Backend AI「バッキー」",
    bio: "API・DB・セキュリティ担当",
    accountType: "ai",
    personaKey: "backend",
    avatarPath: "/avatars/backend-ai.png",
  },
  {
    id: "00000000-0000-4000-8000-000000000102",
    handle: "frontend-ai",
    displayName: "Frontend AI「フローネ」",
    bio: "UI・UX・アクセシビリティ担当",
    accountType: "ai",
    personaKey: "frontend",
    avatarPath: "/avatars/frontend-ai.png",
  },
  {
    id: "00000000-0000-4000-8000-000000000103",
    handle: "reviewer-ai",
    displayName: "Reviewer AI「レビ丸」",
    bio: "品質・リスク・レビュー担当",
    accountType: "ai",
    personaKey: "reviewer",
    avatarPath: "/avatars/reviewer-ai.png",
  },
  {
    id: "00000000-0000-4000-8000-000000000104",
    handle: "pm-ai",
    displayName: "PM AI「ピーエムさん」",
    bio: "優先順位・スコープ・進行担当",
    accountType: "ai",
    personaKey: "pm",
    avatarPath: "/avatars/pm-ai.png",
  },
];

describe("AiMentionList", () => {
  it("renders four AI mention buttons with accessible names", () => {
    render(
      <AiMentionList accounts={aiAccounts} onSelect={() => undefined} />,
    );

    const group = screen.getByRole("group", { name: "AIメンション候補" });
    expect(group).toBeInTheDocument();

    const buttons = screen.getAllByRole("button");
    expect(buttons).toHaveLength(4);

    for (const account of aiAccounts) {
      expect(
        screen.getByRole("button", {
          name: getAiMentionAccessibleName(account),
        }),
      ).toBeInTheDocument();
      expect(screen.getByText(account.displayName)).toBeInTheDocument();
      expect(
        screen.getByText(`@${account.handle} · ${account.bio}`),
      ).toBeInTheDocument();
    }
  });

  it("notifies the selected handle on click without holding form state", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();

    const { container } = render(
      <AiMentionList accounts={aiAccounts} onSelect={onSelect} />,
    );

    expect(container.querySelector("textarea")).toBeNull();
    expect(container.querySelector("form")).toBeNull();

    await user.click(
      screen.getByRole("button", {
        name: getAiMentionAccessibleName(aiAccounts[0]),
      }),
    );

    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith("backend-ai");
  });

  it("selects a mention with Tab and Enter", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();

    render(<AiMentionList accounts={aiAccounts} onSelect={onSelect} />);

    await user.tab();
    expect(
      screen.getByRole("button", {
        name: getAiMentionAccessibleName(aiAccounts[0]),
      }),
    ).toHaveFocus();

    await user.keyboard("{Enter}");
    expect(onSelect).toHaveBeenCalledWith("backend-ai");
  });

  it("selects a mention with Space", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();

    render(<AiMentionList accounts={aiAccounts} onSelect={onSelect} />);

    const button = screen.getByRole("button", {
      name: getAiMentionAccessibleName(aiAccounts[2]),
    });
    button.focus();
    expect(button).toHaveFocus();

    await user.keyboard(" ");
    expect(onSelect).toHaveBeenCalledWith("reviewer-ai");
  });
});
