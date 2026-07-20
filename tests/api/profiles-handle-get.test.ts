import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { GET } from "@/app/api/profiles/[handle]/route";
import { RepositoryError } from "@/lib/repositories/errors";
import { GetProfileError } from "@/lib/services/errors";
import { apiErrorResponseSchema } from "@/lib/validations/common";
import { getProfileResponseSchema } from "@/lib/validations/profile";
import type { GetProfileResponse } from "@/types/api";

const getProfileMock = vi.fn();

vi.mock("@/lib/services/get-profile", () => ({
  getProfile: (...args: unknown[]) => getProfileMock(...args),
}));

const humanResponse: GetProfileResponse = {
  data: {
    id: "00000000-0000-4000-8000-000000000001",
    handle: "you",
    displayName: "あなた",
    bio: "AI社員と一緒に働く人",
    accountType: "human",
    personaKey: null,
    avatarPath: "/avatars/you.png",
  },
};

const aiResponse: GetProfileResponse = {
  data: {
    id: "00000000-0000-4000-8000-000000000101",
    handle: "sendo-ai",
    displayName: "メンターAI「センドウ」",
    bio: "API・DB・設計の相談役。聞かれたら丁寧に教える",
    accountType: "ai",
    personaKey: "backend",
    avatarPath: "/avatars/sendo-ai.png",
  },
};

function createRequest(handle: string): NextRequest {
  return new NextRequest(`http://localhost:3000/api/profiles/${handle}`);
}

function createContext(handle: string) {
  return {
    params: Promise.resolve({ handle }),
  };
}

describe("GET /api/profiles/[handle]", () => {
  beforeEach(() => {
    getProfileMock.mockReset();
  });

  it("returns 200 for a human profile with Cache-Control", async () => {
    getProfileMock.mockResolvedValue(humanResponse);

    const response = await GET(createRequest("you"), createContext("you"));
    const body: unknown = await response.json();

    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe(
      "public, s-maxage=3600, stale-while-revalidate=86400",
    );
    expect(getProfileResponseSchema.safeParse(body).success).toBe(true);
    expect(body).toEqual(humanResponse);
    expect(getProfileMock).toHaveBeenCalledWith({ handle: "you" });
  });

  it("returns 200 for an AI profile with the same shape", async () => {
    getProfileMock.mockResolvedValue(aiResponse);

    const response = await GET(
      createRequest("sendo-ai"),
      createContext("sendo-ai"),
    );
    const body: unknown = await response.json();

    expect(response.status).toBe(200);
    expect(getProfileResponseSchema.safeParse(body).success).toBe(true);
    expect(body).toEqual(aiResponse);
    expect(Object.keys((body as GetProfileResponse).data).sort()).toEqual(
      Object.keys(humanResponse.data).sort(),
    );
  });

  it("returns 400 VALIDATION_ERROR for an invalid handle", async () => {
    const response = await GET(
      createRequest("@sendo-ai"),
      createContext("@sendo-ai"),
    );
    const body: unknown = await response.json();

    expect(response.status).toBe(400);
    expect(getProfileMock).not.toHaveBeenCalled();
    expect(apiErrorResponseSchema.safeParse(body).success).toBe(true);
    expect(body).toMatchObject({
      error: {
        code: "VALIDATION_ERROR",
        message: "入力内容を確認してください。",
      },
    });
    expect(typeof (body as { requestId: string }).requestId).toBe("string");
  });

  it("returns 404 PROFILE_NOT_FOUND with requestId when missing", async () => {
    getProfileMock.mockRejectedValue(
      new GetProfileError("PROFILE_NOT_FOUND", "Profile was not found"),
    );

    const response = await GET(
      createRequest("backend-ai"),
      createContext("backend-ai"),
    );
    const body: unknown = await response.json();

    expect(response.status).toBe(404);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(apiErrorResponseSchema.safeParse(body).success).toBe(true);
    expect(body).toMatchObject({
      error: {
        code: "PROFILE_NOT_FOUND",
        message: "指定されたプロフィールが見つかりません。",
      },
    });
    expect(typeof (body as { requestId: string }).requestId).toBe("string");
    expect(JSON.stringify(body)).not.toContain("Profile was not found");
  });

  it("returns 500 DATABASE_ERROR when the repository fails", async () => {
    getProfileMock.mockRejectedValue(
      new RepositoryError("Failed to load account by handle"),
    );

    const response = await GET(
      createRequest("sendo-ai"),
      createContext("sendo-ai"),
    );
    const body: unknown = await response.json();

    expect(response.status).toBe(500);
    expect(body).toMatchObject({
      error: {
        code: "DATABASE_ERROR",
        message: "データの取得に失敗しました。",
      },
    });
    expect(typeof (body as { requestId: string }).requestId).toBe("string");
    expect(JSON.stringify(body)).not.toContain(
      "Failed to load account by handle",
    );
  });

  it("returns 500 INTERNAL_ERROR for unexpected failures", async () => {
    getProfileMock.mockRejectedValue(new Error("unexpected"));

    const response = await GET(
      createRequest("sendo-ai"),
      createContext("sendo-ai"),
    );
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
