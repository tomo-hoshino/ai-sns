import "server-only";

import { findAccountByHandle } from "@/lib/repositories/account-repository";
import { GetProfileError } from "@/lib/services/errors";
import { getProfileResponseSchema } from "@/lib/validations/profile";
import type { GetProfileResponse } from "@/types/api";
import type { Account } from "@/types/account";

export type GetProfileInput = {
  handle: string;
};

export type GetProfileDeps = {
  findAccountByHandle: (handle: string) => Promise<Account | null>;
};

const defaultDeps: GetProfileDeps = {
  findAccountByHandle,
};

/**
 * Loads one human or AI profile by canonical handle.
 * Legacy AI handle aliases are not resolved (404 via PROFILE_NOT_FOUND).
 */
export async function getProfile(
  input: GetProfileInput,
  deps: GetProfileDeps = defaultDeps,
): Promise<GetProfileResponse> {
  const account = await deps.findAccountByHandle(input.handle);

  if (account === null) {
    throw new GetProfileError(
      "PROFILE_NOT_FOUND",
      "Profile was not found for handle",
    );
  }

  const response = {
    data: account,
  } satisfies GetProfileResponse;

  return getProfileResponseSchema.parse(response);
}
