import { describe, expect, it, vi } from "vitest";

import { RepositoryError } from "@/lib/repositories/errors";
import { getAiAccounts } from "@/lib/services/get-ai-accounts";
import { listAiAccountsResponseSchema } from "@/lib/validations/post";
import type { Account } from "@/types/account";

const aiAccountsOutOfOrder: Account[] = [
  {
    id: "00000000-0000-4000-8000-000000000104",
    handle: "pm-ai",
    displayName: "PM AI「ピーエムさん」",
    bio: "優先順位・スコープ・進行担当",
    accountType: "ai",
    personaKey: "pm",
    avatarPath: "/avatars/pm-ai.png",
  },
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
    id: "00000000-0000-4000-8000-000000000103",
    handle: "reviewer-ai",
    displayName: "Reviewer AI「レビ丸」",
    bio: "品質・リスク・レビュー担当",
    accountType: "ai",
    personaKey: "reviewer",
    avatarPath: "/avatars/reviewer-ai.png",
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
      "backend-ai",
      "frontend-ai",
      "reviewer-ai",
      "pm-ai",
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
