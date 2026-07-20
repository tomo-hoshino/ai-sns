import { describe, expect, it } from "vitest";

import { extractMentionedAiAccounts } from "@/lib/ai/mentions";
import type { Account } from "@/types/account";

const sendoAi: Account = {
  id: "00000000-0000-4000-8000-000000000101",
  handle: "sendo-ai",
  displayName: "メンターAI「センドウ」",
  bio: "API・DB・設計の相談役。聞かれたら丁寧に教える",
  accountType: "ai",
  personaKey: "backend",
  avatarPath: "/avatars/sendo-ai.png",
};

const soraAi: Account = {
  id: "00000000-0000-4000-8000-000000000102",
  handle: "sora-ai",
  displayName: "気ままAI「ソラ」",
  bio: "UIと体験を自由に組み立てる。縛りが少ないほど本領を発揮する",
  accountType: "ai",
  personaKey: "frontend",
  avatarPath: "/avatars/sora-ai.png",
};

const hiyoriAi: Account = {
  id: "00000000-0000-4000-8000-000000000103",
  handle: "hiyori-ai",
  displayName: "ひよっこAI「ヒヨリ」",
  bio: "品質を真面目に気にする新人。純粋な指摘が思わぬ急所を突くこともある",
  accountType: "ai",
  personaKey: "reviewer",
  avatarPath: "/avatars/hiyori-ai.png",
};

const kanameAi: Account = {
  id: "00000000-0000-4000-8000-000000000104",
  handle: "kaname-ai",
  displayName: "進行AI「カナメ」",
  bio: "タスクと優先順位を見渡し、締切とscopeを守る",
  accountType: "ai",
  personaKey: "pm",
  avatarPath: "/avatars/kaname-ai.png",
};

const aiAccounts: readonly Account[] = [
  sendoAi,
  soraAi,
  hiyoriAi,
  kanameAi,
];

describe("extractMentionedAiAccounts", () => {
  it("returns the matching Account object, not only the handle string", () => {
    const result = extractMentionedAiAccounts(
      "@sendo-ai 確認して",
      aiAccounts,
    );

    expect(result).toHaveLength(1);
    expect(result[0]).toBe(sendoAi);
    expect(result[0]).toEqual(sendoAi);
  });

  it("ignores unknown handles", () => {
    const result = extractMentionedAiAccounts(
      "@unknown-ai @nobody こんにちは",
      aiAccounts,
    );

    expect(result).toEqual([]);
  });

  it("does not treat @sendo-ai-test as @sendo-ai", () => {
    const result = extractMentionedAiAccounts(
      "@sendo-ai-test これは似たhandleです",
      aiAccounts,
    );

    expect(result).toEqual([]);
  });

  it("matches handles surrounded by punctuation", () => {
    const result = extractMentionedAiAccounts(
      "確認して @sendo-ai! よろしく。(@sora-ai)",
      aiAccounts,
    );

    expect(result).toEqual([sendoAi, soraAi]);
  });

  it("matches handles separated by newlines", () => {
    const result = extractMentionedAiAccounts(
      "@sendo-ai\n@sora-ai\n確認お願いします",
      aiAccounts,
    );

    expect(result).toEqual([sendoAi, soraAi]);
  });

  it("deduplicates the same AI and keeps the first occurrence", () => {
    const result = extractMentionedAiAccounts(
      "@sendo-ai @sora-ai @sendo-ai もう一度",
      aiAccounts,
    );

    expect(result).toEqual([sendoAi, soraAi]);
  });

  it("matches handles case-insensitively", () => {
    const result = extractMentionedAiAccounts(
      "@Sendo-AI @SORA-AI 確認して",
      aiAccounts,
    );

    expect(result).toEqual([sendoAi, soraAi]);
  });

  it("preserves appearance order regardless of account list order", () => {
    const reversedAccounts = [...aiAccounts].reverse();
    const result = extractMentionedAiAccounts(
      "@kaname-ai @hiyori-ai @sora-ai @sendo-ai",
      reversedAccounts,
    );

    expect(result).toEqual([kanameAi, hiyoriAi, soraAi, sendoAi]);
  });

  it("returns at most 4 unique AI accounts", () => {
    const result = extractMentionedAiAccounts(
      "@sendo-ai @sora-ai @hiyori-ai @kaname-ai @sendo-ai",
      aiAccounts,
    );

    expect(result).toHaveLength(4);
    expect(result).toEqual([sendoAi, soraAi, hiyoriAi, kanameAi]);
  });

  it("returns an empty array when there are no mentions", () => {
    expect(extractMentionedAiAccounts("メンションなし", aiAccounts)).toEqual(
      [],
    );
  });

  it("ignores the human handle @guest when only AI accounts are provided", () => {
    const result = extractMentionedAiAccounts(
      "@guest @sendo-ai 見てください",
      aiAccounts,
    );

    expect(result).toEqual([sendoAi]);
  });

  it("keeps a valid AI when an unknown similar handle appears first", () => {
    const result = extractMentionedAiAccounts(
      "@sendo-ai-test @sendo-ai 本番handleだけ有効",
      aiAccounts,
    );

    expect(result).toEqual([sendoAi]);
  });

  it("resolves legacy handles to the canonical Account", () => {
    const result = extractMentionedAiAccounts(
      "@backend-ai @frontend-ai 旧handleでも起動",
      aiAccounts,
    );

    expect(result).toEqual([sendoAi, soraAi]);
  });

  it("deduplicates legacy alias and canonical handle for the same AI", () => {
    const result = extractMentionedAiAccounts(
      "@backend-ai @sendo-ai @sora-ai",
      aiAccounts,
    );

    expect(result).toEqual([sendoAi, soraAi]);
  });

  it("resolves all four legacy aliases in appearance order", () => {
    const result = extractMentionedAiAccounts(
      "@pm-ai @reviewer-ai @frontend-ai @backend-ai",
      aiAccounts,
    );

    expect(result).toEqual([kanameAi, hiyoriAi, soraAi, sendoAi]);
  });
});
