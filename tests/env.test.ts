import { describe, expect, it } from "vitest";

import { parsePublicEnv, parseServerEnv, tryParsePublicEnv } from "@/lib/env";

const validServerEnv = {
  NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon-key",
  SUPABASE_SERVICE_ROLE_KEY: "service-role-key",
  OPENAI_API_KEY: "openai-api-key",
  OPENAI_MODEL: "gpt-5.6-luna",
  AI_REPLIES_ENABLED: "true",
};

describe("parseServerEnv", () => {
  it("parses valid values and converts AI_REPLIES_ENABLED to boolean", () => {
    expect(parseServerEnv(validServerEnv)).toEqual({
      NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon-key",
      SUPABASE_SERVICE_ROLE_KEY: "service-role-key",
      OPENAI_API_KEY: "openai-api-key",
      OPENAI_MODEL: "gpt-5.6-luna",
      AI_REPLIES_ENABLED: true,
    });

    expect(
      parseServerEnv({
        ...validServerEnv,
        AI_REPLIES_ENABLED: "false",
      }).AI_REPLIES_ENABLED,
    ).toBe(false);
  });

  it("includes the missing variable name in the error", () => {
    expect(() =>
      parseServerEnv({
        ...validServerEnv,
        OPENAI_API_KEY: undefined,
      }),
    ).toThrow(/OPENAI_API_KEY/);
  });

  it("rejects an invalid Supabase URL with the variable name", () => {
    expect(() =>
      parseServerEnv({
        ...validServerEnv,
        NEXT_PUBLIC_SUPABASE_URL: "not-a-url",
      }),
    ).toThrow(/NEXT_PUBLIC_SUPABASE_URL/);
  });

  it("rejects empty anon key with the variable name", () => {
    expect(() =>
      parseServerEnv({
        ...validServerEnv,
        NEXT_PUBLIC_SUPABASE_ANON_KEY: "",
      }),
    ).toThrow(/NEXT_PUBLIC_SUPABASE_ANON_KEY/);
  });

  it("rejects empty secret values with the variable name", () => {
    expect(() =>
      parseServerEnv({
        ...validServerEnv,
        SUPABASE_SERVICE_ROLE_KEY: "",
      }),
    ).toThrow(/SUPABASE_SERVICE_ROLE_KEY/);
  });

  it("rejects unsafe AI_REPLIES_ENABLED strings", () => {
    expect(() =>
      parseServerEnv({
        ...validServerEnv,
        AI_REPLIES_ENABLED: "1",
      }),
    ).toThrow(/AI_REPLIES_ENABLED/);
  });
});

describe("parsePublicEnv", () => {
  it("parses the public URL and anon key", () => {
    expect(
      parsePublicEnv({
        NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
        NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon-key",
      }),
    ).toEqual({
      NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon-key",
    });
  });

  it("does not accept server secrets as part of the public schema", () => {
    const publicEnv = parsePublicEnv({
      NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon-key",
    });

    expect(publicEnv).not.toHaveProperty("SUPABASE_SERVICE_ROLE_KEY");
    expect(publicEnv).not.toHaveProperty("OPENAI_API_KEY");
  });
});

describe("tryParsePublicEnv", () => {
  it("returns null when the anon key is missing", () => {
    expect(
      tryParsePublicEnv({
        NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
      }),
    ).toBeNull();
  });

  it("returns public env when valid", () => {
    expect(
      tryParsePublicEnv({
        NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
        NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon-key",
      }),
    ).toEqual({
      NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon-key",
    });
  });
});
