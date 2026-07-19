import "server-only";

import OpenAI from "openai";

import { getEnv } from "@/lib/env";

let client: OpenAI | undefined;

/**
 * Lazily create a singleton OpenAI client with the server API key.
 * Browser/client bundles must not import this module.
 */
export function getOpenAIClient(): OpenAI {
  if (client) {
    return client;
  }

  const env = getEnv();
  client = new OpenAI({
    apiKey: env.OPENAI_API_KEY,
  });

  return client;
}
