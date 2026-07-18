import { describe, expect, it } from "vitest";

import { RepositoryError } from "@/lib/repositories/errors";
import {
  isProfileRow,
  mapAccount,
  mapAccountFromUnknown,
} from "@/lib/repositories/map-account";

const humanRow = {
  id: "00000000-0000-4000-8000-000000000001",
  handle: "you",
  display_name: "あなた",
  bio: "AI社員と一緒に働く人",
  account_type: "human",
  persona_key: null,
  avatar_path: "/avatars/you.png",
};

const aiRow = {
  id: "00000000-0000-4000-8000-000000000101",
  handle: "backend-ai",
  display_name: "Backend AI「バッキー」",
  bio: "API・DB・セキュリティ担当",
  account_type: "ai",
  persona_key: "backend",
  avatar_path: "/avatars/backend-ai.png",
};

describe("mapAccount", () => {
  it("maps a human profile row to camelCase Account", () => {
    expect(mapAccount(humanRow)).toEqual({
      id: humanRow.id,
      handle: "you",
      displayName: "あなた",
      bio: "AI社員と一緒に働く人",
      accountType: "human",
      personaKey: null,
      avatarPath: "/avatars/you.png",
    });
  });

  it("maps an AI profile row with personaKey", () => {
    expect(mapAccount(aiRow)).toEqual({
      id: aiRow.id,
      handle: "backend-ai",
      displayName: "Backend AI「バッキー」",
      bio: "API・DB・セキュリティ担当",
      accountType: "ai",
      personaKey: "backend",
      avatarPath: "/avatars/backend-ai.png",
    });
  });

  it("rejects unknown account_type", () => {
    expect(() => mapAccount({ ...humanRow, account_type: "bot" })).toThrow(
      RepositoryError,
    );
  });

  it("rejects human rows with a persona_key", () => {
    expect(() => mapAccount({ ...humanRow, persona_key: "backend" })).toThrow(
      RepositoryError,
    );
  });

  it("rejects AI rows with null or unknown persona_key", () => {
    expect(() => mapAccount({ ...aiRow, persona_key: null })).toThrow(
      RepositoryError,
    );
    expect(() => mapAccount({ ...aiRow, persona_key: "designer" })).toThrow(
      RepositoryError,
    );
  });
});

describe("mapAccountFromUnknown", () => {
  it("accepts a valid row shape", () => {
    expect(isProfileRow(humanRow)).toBe(true);
    expect(mapAccountFromUnknown(humanRow).handle).toBe("you");
  });

  it("rejects malformed rows", () => {
    expect(isProfileRow({ id: "x" })).toBe(false);
    expect(() => mapAccountFromUnknown({ id: "x" })).toThrow(RepositoryError);
  });
});
