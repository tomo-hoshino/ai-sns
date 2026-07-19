import { describe, expect, it } from "vitest";

import { splitContentWithMentions } from "@/features/posts/utils/split-content-with-mentions";
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

const aiAccounts: readonly Account[] = [sendoAi, soraAi];

describe("splitContentWithMentions", () => {
  it("keeps plain text as a single text segment", () => {
    expect(splitContentWithMentions("こんにちは", aiAccounts)).toEqual([
      { type: "text", value: "こんにちは" },
    ]);
  });

  it("splits valid AI mentions from surrounding text", () => {
    const segments = splitContentWithMentions(
      "確認お願いします @sendo-ai です",
      aiAccounts,
    );

    expect(segments).toEqual([
      { type: "text", value: "確認お願いします " },
      { type: "mention", value: "@sendo-ai", account: sendoAi },
      { type: "text", value: " です" },
    ]);
  });

  it("does not treat similar handles as valid mentions", () => {
    const segments = splitContentWithMentions(
      "@sendo-ai-test こんにちは",
      aiAccounts,
    );

    expect(segments).toEqual([
      { type: "text", value: "@sendo-ai-test こんにちは" },
    ]);
  });

  it("matches handles case-insensitively while preserving original text", () => {
    const segments = splitContentWithMentions("@Backend-AI 見", aiAccounts);

    expect(segments).toEqual([
      { type: "mention", value: "@Backend-AI", account: sendoAi },
      { type: "text", value: " 見" },
    ]);
  });

  it("highlights legacy alias mentions against the canonical Account", () => {
    const segments = splitContentWithMentions(
      "旧 @backend-ai を強調",
      aiAccounts,
    );

    expect(segments).toEqual([
      { type: "text", value: "旧 " },
      { type: "mention", value: "@backend-ai", account: sendoAi },
      { type: "text", value: " を強調" },
    ]);
  });
});
