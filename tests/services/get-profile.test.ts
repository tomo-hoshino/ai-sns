import { describe, expect, it, vi } from "vitest";

import { GetProfileError } from "@/lib/services/errors";
import { getProfile } from "@/lib/services/get-profile";
import { getProfileResponseSchema } from "@/lib/validations/profile";
import type { Account } from "@/types/account";

const humanAccount: Account = {
  id: "00000000-0000-4000-8000-000000000001",
  handle: "you",
  displayName: "あなた",
  bio: "AI社員と一緒に働く人",
  accountType: "human",
  personaKey: null,
  avatarPath: "/avatars/you.png",
};

const aiAccount: Account = {
  id: "00000000-0000-4000-8000-000000000101",
  handle: "sendo-ai",
  displayName: "メンターAI「センドウ」",
  bio: "API・DB・設計の相談役。聞かれたら丁寧に教える",
  accountType: "ai",
  personaKey: "backend",
  avatarPath: "/avatars/sendo-ai.png",
};

describe("getProfile", () => {
  it("returns a human profile with null personaKey", async () => {
    const findAccountByHandle = vi.fn().mockResolvedValue(humanAccount);

    const result = await getProfile({ handle: "you" }, { findAccountByHandle });

    expect(getProfileResponseSchema.safeParse(result).success).toBe(true);
    expect(result).toEqual({ data: humanAccount });
    expect(result.data.personaKey).toBeNull();
    expect(findAccountByHandle).toHaveBeenCalledWith("you");
  });

  it("returns an AI profile with the same response shape", async () => {
    const findAccountByHandle = vi.fn().mockResolvedValue(aiAccount);

    const result = await getProfile(
      { handle: "sendo-ai" },
      { findAccountByHandle },
    );

    expect(getProfileResponseSchema.safeParse(result).success).toBe(true);
    expect(result).toEqual({ data: aiAccount });
    expect(Object.keys(result.data).sort()).toEqual(
      Object.keys(humanAccount).sort(),
    );
    expect(result.data.personaKey).toBe("backend");
  });

  it("throws PROFILE_NOT_FOUND when the handle does not exist", async () => {
    const findAccountByHandle = vi.fn().mockResolvedValue(null);

    await expect(
      getProfile({ handle: "backend-ai" }, { findAccountByHandle }),
    ).rejects.toMatchObject({
      name: "GetProfileError",
      code: "PROFILE_NOT_FOUND",
    });
    await expect(
      getProfile({ handle: "missing" }, { findAccountByHandle }),
    ).rejects.toBeInstanceOf(GetProfileError);
  });
});
