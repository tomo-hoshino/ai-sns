import "server-only";

import { z } from "zod";

const publicEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
});

const serverEnvSchema = publicEnvSchema.extend({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  OPENAI_API_KEY: z.string().min(1),
  OPENAI_MODEL: z.string().min(1),
  AI_REPLIES_ENABLED: z.stringbool({
    truthy: ["true"],
    falsy: ["false"],
  }),
});

export type PublicEnv = z.infer<typeof publicEnvSchema>;
export type ServerEnv = z.infer<typeof serverEnvSchema>;

export type PublicEnvInput = {
  NEXT_PUBLIC_SUPABASE_URL?: string;
  NEXT_PUBLIC_SUPABASE_ANON_KEY?: string;
};

export type ServerEnvInput = PublicEnvInput & {
  SUPABASE_SERVICE_ROLE_KEY?: string;
  OPENAI_API_KEY?: string;
  OPENAI_MODEL?: string;
  AI_REPLIES_ENABLED?: string;
};

function formatEnvError(error: z.ZodError): string {
  const details = error.issues.map((issue) => {
    const name = issue.path.join(".") || "(unknown)";
    return `${name}: ${issue.message}`;
  });

  return `Invalid environment variables:\n${details.join("\n")}`;
}

function pickEnvValues(raw: ServerEnvInput) {
  return {
    NEXT_PUBLIC_SUPABASE_URL: raw.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: raw.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: raw.SUPABASE_SERVICE_ROLE_KEY,
    OPENAI_API_KEY: raw.OPENAI_API_KEY,
    OPENAI_MODEL: raw.OPENAI_MODEL,
    AI_REPLIES_ENABLED: raw.AI_REPLIES_ENABLED,
  };
}

/** Validate the public subset. Secrets must not be passed here. */
export function parsePublicEnv(raw: PublicEnvInput): PublicEnv {
  const result = publicEnvSchema.safeParse({
    NEXT_PUBLIC_SUPABASE_URL: raw.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: raw.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  });

  if (!result.success) {
    throw new Error(formatEnvError(result.error));
  }

  return result.data;
}

/** Soft-parse public env for optional Auth UI paths (e.g. Header). */
export function tryParsePublicEnv(raw: PublicEnvInput): PublicEnv | null {
  const result = publicEnvSchema.safeParse({
    NEXT_PUBLIC_SUPABASE_URL: raw.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: raw.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  });
  if (!result.success) {
    return null;
  }
  return result.data;
}

/** Validate server env, including secrets. Call from server code only. */
export function parseServerEnv(raw: ServerEnvInput): ServerEnv {
  const result = serverEnvSchema.safeParse(pickEnvValues(raw));

  if (!result.success) {
    throw new Error(formatEnvError(result.error));
  }

  return result.data;
}

let cachedServerEnv: ServerEnv | undefined;

/** Lazily validated server environment. Throws with variable names on failure. */
export function getEnv(): ServerEnv {
  cachedServerEnv ??= parseServerEnv({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    OPENAI_MODEL: process.env.OPENAI_MODEL,
    AI_REPLIES_ENABLED: process.env.AI_REPLIES_ENABLED,
  });
  return cachedServerEnv;
}
