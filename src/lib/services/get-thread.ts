import "server-only";

import { findThreadByRootId } from "@/lib/repositories/post-repository";
import { GetThreadError } from "@/lib/services/errors";
import { getThreadResponseSchema } from "@/lib/validations/post";
import type { GetThreadResponse } from "@/types/api";
import type { Thread } from "@/types/post";

export type GetThreadInput = {
  rootPostId: string;
};

export type GetThreadDeps = {
  findThreadByRootId: (rootPostId: string) => Promise<Thread | null>;
};

const defaultDeps: GetThreadDeps = {
  findThreadByRootId,
};

/**
 * Loads a root post and its direct replies (oldest first).
 * Throws when the id is missing or refers to a reply post.
 */
export async function getThread(
  input: GetThreadInput,
  deps: GetThreadDeps = defaultDeps,
): Promise<GetThreadResponse> {
  const thread = await deps.findThreadByRootId(input.rootPostId);

  if (thread === null) {
    throw new GetThreadError(
      "THREAD_NOT_FOUND",
      "Thread root post was not found",
    );
  }

  const response = {
    data: {
      root: thread.root,
      replies: thread.replies,
    },
  } satisfies GetThreadResponse;

  return getThreadResponseSchema.parse(response);
}
