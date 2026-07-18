import { describe, expect, it } from "vitest";

import { extractMentionedAiAccounts } from "@/lib/ai/mentions";
import type { Account } from "@/types/account";

const backendAi: Account = {
  id: "00000000-0000-4000-8000-000000000101",
  handle: "backend-ai",
  displayName: "Backend AI「バッキー」",
  bio: "API・DB・セキュリティ担当",
  accountType: "ai",
  personaKey: "backend",
  avatarPath: "/avatars/backend-ai.png",
};

const frontendAi: Account = {
  id: "00000000-0000-4000-8000-000000000102",
  handle: "frontend-ai",
  displayName: "Frontend AI「フローネ」",
  bio: "UI・UX・アクセシビリティ担当",
  accountType: "ai",
  personaKey: "frontend",
  avatarPath: "/avatars/frontend-ai.png",
};

const reviewerAi: Account = {
  id: "00000000-0000-4000-8000-000000000103",
  handle: "reviewer-ai",
  displayName: "Reviewer AI「レビ丸」",
  bio: "品質・リスク・レビュー担当",
  accountType: "ai",
  personaKey: "reviewer",
  avatarPath: "/avatars/reviewer-ai.png",
};

const pmAi: Account = {
  id: "00000000-0000-4000-8000-000000000104",
  handle: "pm-ai",
  displayName: "PM AI「ピーエムさん」",
  bio: "優先順位・スコープ・進行担当",
  accountType: "ai",
  personaKey: "pm",
  avatarPath: "/avatars/pm-ai.png",
};

const aiAccounts: readonly Account[] = [
  backendAi,
  frontendAi,
  reviewerAi,
  pmAi,
];

describe("extractMentionedAiAccounts", () => {
  it("returns the matching Account object, not only the handle string", () => {
    const result = extractMentionedAiAccounts(
      "@backend-ai 確認して",
      aiAccounts,
    );

    expect(result).toHaveLength(1);
    expect(result[0]).toBe(backendAi);
    expect(result[0]).toEqual(backendAi);
  });

  it("ignores unknown handles", () => {
    const result = extractMentionedAiAccounts(
      "@unknown-ai @nobody こんにちは",
      aiAccounts,
    );

    expect(result).toEqual([]);
  });

  it("does not treat @backend-ai-test as @backend-ai", () => {
    const result = extractMentionedAiAccounts(
      "@backend-ai-test これは似たhandleです",
      aiAccounts,
    );

    expect(result).toEqual([]);
  });

  it("matches handles surrounded by punctuation", () => {
    const result = extractMentionedAiAccounts(
      "確認して @backend-ai! よろしく。(@frontend-ai)",
      aiAccounts,
    );

    expect(result).toEqual([backendAi, frontendAi]);
  });

  it("matches handles separated by newlines", () => {
    const result = extractMentionedAiAccounts(
      "@backend-ai\n@frontend-ai\n確認お願いします",
      aiAccounts,
    );

    expect(result).toEqual([backendAi, frontendAi]);
  });

  it("deduplicates the same AI and keeps the first occurrence", () => {
    const result = extractMentionedAiAccounts(
      "@backend-ai @frontend-ai @backend-ai もう一度",
      aiAccounts,
    );

    expect(result).toEqual([backendAi, frontendAi]);
  });

  it("matches handles case-insensitively", () => {
    const result = extractMentionedAiAccounts(
      "@Backend-AI @FRONTEND-AI 確認して",
      aiAccounts,
    );

    expect(result).toEqual([backendAi, frontendAi]);
  });

  it("preserves appearance order regardless of account list order", () => {
    const reversedAccounts = [...aiAccounts].reverse();
    const result = extractMentionedAiAccounts(
      "@pm-ai @reviewer-ai @frontend-ai @backend-ai",
      reversedAccounts,
    );

    expect(result).toEqual([pmAi, reviewerAi, frontendAi, backendAi]);
  });

  it("returns at most 4 unique AI accounts", () => {
    const result = extractMentionedAiAccounts(
      "@backend-ai @frontend-ai @reviewer-ai @pm-ai @backend-ai",
      aiAccounts,
    );

    expect(result).toHaveLength(4);
    expect(result).toEqual([backendAi, frontendAi, reviewerAi, pmAi]);
  });

  it("returns an empty array when there are no mentions", () => {
    expect(extractMentionedAiAccounts("メンションなし", aiAccounts)).toEqual(
      [],
    );
  });

  it("ignores the human handle @you when only AI accounts are provided", () => {
    const result = extractMentionedAiAccounts(
      "@you @backend-ai 見てください",
      aiAccounts,
    );

    expect(result).toEqual([backendAi]);
  });

  it("keeps a valid AI when an unknown similar handle appears first", () => {
    const result = extractMentionedAiAccounts(
      "@backend-ai-test @backend-ai 本番handleだけ有効",
      aiAccounts,
    );

    expect(result).toEqual([backendAi]);
  });
});
