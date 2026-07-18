import { describe, expect, it } from "vitest";

import { splitContentWithMentions } from "@/features/posts/utils/split-content-with-mentions";
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

const aiAccounts: readonly Account[] = [backendAi, frontendAi];

describe("splitContentWithMentions", () => {
  it("keeps plain text as a single text segment", () => {
    expect(splitContentWithMentions("こんにちは", aiAccounts)).toEqual([
      { type: "text", value: "こんにちは" },
    ]);
  });

  it("splits valid AI mentions from surrounding text", () => {
    const segments = splitContentWithMentions(
      "確認お願いします @backend-ai です",
      aiAccounts,
    );

    expect(segments).toEqual([
      { type: "text", value: "確認お願いします " },
      { type: "mention", value: "@backend-ai", account: backendAi },
      { type: "text", value: " です" },
    ]);
  });

  it("does not treat similar handles as valid mentions", () => {
    const segments = splitContentWithMentions(
      "@backend-ai-test を見て",
      aiAccounts,
    );

    expect(segments).toEqual([
      { type: "text", value: "@backend-ai-test を見て" },
    ]);
  });

  it("matches handles case-insensitively while preserving original text", () => {
    const segments = splitContentWithMentions("@Backend-AI へ", aiAccounts);

    expect(segments).toEqual([
      { type: "mention", value: "@Backend-AI", account: backendAi },
      { type: "text", value: " へ" },
    ]);
  });
});
