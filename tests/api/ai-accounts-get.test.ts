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
