import { describe, expect, it } from "vitest";

import { parsePublicEnv, parseServerEnv } from "@/lib/env";

const validServerEnv = {
  NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
  SUPABASE_SERVICE_ROLE_KEY: "service-role-key",
  OPENAI_API_KEY: "openai-api-key",
  OPENAI_MODEL: "gpt-5.6-luna",
  AI_REPLIES_ENABLED: "true",
};

describe("parseServerEnv", () => {
  it("parses valid values and converts AI_REPLIES_ENABLED to boolean", () => {
    expect(parseServerEnv(validServerEnv)).toEqual({
      NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
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
  it("parses only the public URL", () => {
    expect(
      parsePublicEnv({
        NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
      }),
    ).toEqual({
      NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
    });
  });

  it("does not accept server secrets as part of the public schema", () => {
    const publicEnv = parsePublicEnv({
      NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
    });

    expect(publicEnv).not.toHaveProperty("SUPABASE_SERVICE_ROLE_KEY");
    expect(publicEnv).not.toHaveProperty("OPENAI_API_KEY");
  });
});
