import { describe, expect, it, vi } from "vitest";

import { RepositoryError } from "@/lib/repositories/errors";
import { getAiAccounts } from "@/lib/services/get-ai-accounts";
import { listAiAccountsResponseSchema } from "@/lib/validations/post";
import type { Account } from "@/types/account";

const aiAccountsOutOfOrder: Account[] = [
  {
    id: "00000000-0000-4000-8000-000000000104",
    handle: "kaname-ai",
    displayName: "進行AI「カナメ」",
    bio: "タスクと優先順位を見渡し、締切とscopeを守る",
    accountType: "ai",
    personaKey: "pm",
    avatarPath: "/avatars/kaname-ai.png",
  },
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
    id: "00000000-0000-4000-8000-000000000103",
    handle: "hiyori-ai",
    displayName: "ひよっこAI「ヒヨリ」",
    bio: "品質を真面目に気にする新人。純粋な指摘が思わぬ急所を突くこともある",
    accountType: "ai",
    personaKey: "reviewer",
    avatarPath: "/avatars/hiyori-ai.png",
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
];

describe("getAiAccounts", () => {
  it("returns only AI accounts sorted by fixed persona order", async () => {
    const findAiAccounts = vi.fn().mockResolvedValue(aiAccountsOutOfOrder);

    const result = await getAiAccounts({ findAiAccounts });

    expect(listAiAccountsResponseSchema.safeParse(result).success).toBe(true);
    expect(result.data.map((account) => account.personaKey)).toEqual([
      "backend",
      "frontend",
      "reviewer",
      "pm",
    ]);
    expect(result.data.every((account) => account.accountType === "ai")).toBe(
      true,
    );
  });

  it("does not depend on repository row order for sorting", async () => {
    const reversed = [...aiAccountsOutOfOrder].reverse();
    const findAiAccounts = vi.fn().mockResolvedValue(reversed);

    const result = await getAiAccounts({ findAiAccounts });

    expect(result.data.map((account) => account.handle)).toEqual([
      "sendo-ai",
      "sora-ai",
      "hiyori-ai",
      "kaname-ai",
    ]);
  });

  it("throws RepositoryError when a human account is included", async () => {
    const findAiAccounts = vi.fn().mockResolvedValue([
      {
        id: "00000000-0000-4000-8000-000000000001",
        handle: "you",
        displayName: "あなた",
        bio: "AI社員と一緒に働く人",
        accountType: "human",
        personaKey: null,
        avatarPath: "/avatars/you.png",
      },
    ]);

    await expect(getAiAccounts({ findAiAccounts })).rejects.toBeInstanceOf(
      RepositoryError,
    );
  });

  it("propagates repository failures", async () => {
    const findAiAccounts = vi
      .fn()
      .mockRejectedValue(new RepositoryError("Failed to load AI accounts"));

    await expect(getAiAccounts({ findAiAccounts })).rejects.toBeInstanceOf(
      RepositoryError,
    );
  });
});
