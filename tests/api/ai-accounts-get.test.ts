import { beforeEach, describe, expect, it, vi } from "vitest";

import { GET } from "@/app/api/ai-accounts/route";
import { RepositoryError } from "@/lib/repositories/errors";
import { apiErrorResponseSchema } from "@/lib/validations/common";
import { listAiAccountsResponseSchema } from "@/lib/validations/post";
import type { ListAiAccountsResponse } from "@/types/api";

const getAiAccountsMock = vi.fn();

vi.mock("@/lib/services/get-ai-accounts", () => ({
  getAiAccounts: (...args: unknown[]) => getAiAccountsMock(...args),
}));

const sampleResponse: ListAiAccountsResponse = {
  data: [
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
  ],
};

describe("GET /api/ai-accounts", () => {
  beforeEach(() => {
    getAiAccountsMock.mockReset();
  });

  it("returns 200 with AI accounts and the documented Cache-Control", async () => {
    getAiAccountsMock.mockResolvedValue(sampleResponse);

    const response = await GET();
    const body: unknown = await response.json();

    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe(
      "public, s-maxage=3600, stale-while-revalidate=86400",
    );
    expect(listAiAccountsResponseSchema.safeParse(body).success).toBe(true);
    expect(body).toEqual(sampleResponse);
    expect(
      sampleResponse.data.every((account) => account.accountType === "ai"),
    ).toBe(true);
  });

  it("returns 500 DATABASE_ERROR when the repository fails", async () => {
    getAiAccountsMock.mockRejectedValue(
      new RepositoryError("Failed to load AI accounts"),
    );

    const response = await GET();
    const body: unknown = await response.json();

    expect(response.status).toBe(500);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(apiErrorResponseSchema.safeParse(body).success).toBe(true);
    expect(body).toMatchObject({
      error: {
        code: "DATABASE_ERROR",
        message: "データの取得に失敗しました。",
      },
    });
    expect(typeof (body as { requestId: string }).requestId).toBe("string");
    expect(JSON.stringify(body)).not.toContain("Failed to load AI accounts");
  });

  it("returns 500 INTERNAL_ERROR for unexpected failures", async () => {
    getAiAccountsMock.mockRejectedValue(new Error("unexpected"));

    const response = await GET();
    const body: unknown = await response.json();

    expect(response.status).toBe(500);
    expect(body).toMatchObject({
      error: {
        code: "INTERNAL_ERROR",
        message: "サーバーでエラーが発生しました。",
      },
    });
  });
});
