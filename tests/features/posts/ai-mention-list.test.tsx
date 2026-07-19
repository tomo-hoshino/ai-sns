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
    handle: "sendo-ai",
    displayName: "メンターAI「センドウ」",
    bio: "API・DB・設計の相談役。聞かれたら丁寧に教える",
    accountType: "ai",
    personaKey: "backend",
    avatarPath: "/avatars/sendo-ai.png",
  },
  {
    id: "00000000-0000-4000-8000-000000000102",
    handle: "sora-ai",
    displayName: "気ままAI「ソラ」",
    bio: "UIと体験を自由に組み立てる。縛りが少ないほど本領を発揮する",
    accountType: "ai",
    personaKey: "frontend",
    avatarPath: "/avatars/sora-ai.png",
  },
  {
    id: "00000000-0000-4000-8000-000000000103",
    handle: "hiyori-ai",
    displayName: "ひよっこAI「ヒヨリ」",
    bio: "品質を真面目に気にする新人。純粋な指摘が思わぬ急所を突くこともある",
    accountType: "ai",
    personaKey: "reviewer",
    avatarPath: "/avatars/hiyori-ai.png",
  },
  {
    id: "00000000-0000-4000-8000-000000000104",
    handle: "kaname-ai",
    displayName: "進行AI「カナメ」",
    bio: "タスクと優先順位を見渡し、締切とscopeを守る",
    accountType: "ai",
    personaKey: "pm",
    avatarPath: "/avatars/kaname-ai.png",
  },
];

describe("AiMentionList", () => {
  it("renders four AI mention buttons with accessible names", () => {
    render(<AiMentionList accounts={aiAccounts} onSelect={() => undefined} />);

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
    expect(onSelect).toHaveBeenCalledWith("sendo-ai");
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
    expect(onSelect).toHaveBeenCalledWith("sendo-ai");
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
    expect(onSelect).toHaveBeenCalledWith("hiyori-ai");
  });

  it("disables all mention buttons when disabled", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();

    render(
      <AiMentionList accounts={aiAccounts} onSelect={onSelect} disabled />,
    );

    const buttons = screen.getAllByRole("button");
    expect(buttons).toHaveLength(4);
    for (const button of buttons) {
      expect(button).toBeDisabled();
    }

    await user.click(buttons[0]);
    expect(onSelect).not.toHaveBeenCalled();
  });
});
