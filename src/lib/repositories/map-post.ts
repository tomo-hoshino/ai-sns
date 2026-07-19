import type { Post, TimelinePost } from "@/types/post";

import { RepositoryError } from "@/lib/repositories/errors";
import {
  isProfileRow,
  mapAccount,
  type ProfileRowInput,
} from "@/lib/repositories/map-account";

export type PostRowInput = {
  id: string;
  content: string;
  created_at: string;
  parent_post_id: string | null;
  author: ProfileRowInput;
};

export type TimelinePostRowInput = PostRowInput & {
  replies: Array<{ count: number }>;
};

export function isPostRow(value: unknown): value is PostRowInput {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  if (
    !("id" in value) ||
    !("content" in value) ||
    !("created_at" in value) ||
    !("parent_post_id" in value) ||
    !("author" in value)
  ) {
    return false;
  }

  if (
    typeof value.id !== "string" ||
    typeof value.content !== "string" ||
    typeof value.created_at !== "string" ||
    !(value.parent_post_id === null || typeof value.parent_post_id === "string")
  ) {
    return false;
  }

  return isProfileRow(value.author);
}

function isReplyCountEmbed(value: unknown): value is Array<{ count: number }> {
  if (!Array.isArray(value) || value.length !== 1) {
    return false;
  }
  const first = value[0];
  return (
    typeof first === "object" &&
    first !== null &&
    "count" in first &&
    typeof first.count === "number" &&
    Number.isInteger(first.count) &&
    first.count >= 0
  );
}

export function isTimelinePostRow(
  value: unknown,
): value is TimelinePostRowInput {
  if (!isPostRow(value)) {
    return false;
  }
  if (!("replies" in value)) {
    return false;
  }
  return isReplyCountEmbed(value.replies);
}

/**
 * PostgREST returns timestamptz as offset ISO (often +00:00, microsecond
 * precision). API.md requires UTC ISO 8601 with Z for createdAt.
 */
export function toUtcIsoDateTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new RepositoryError("Invalid created_at from database");
  }
  return date.toISOString();
}

/**
 * Maps a posts DB row with joined author to the Post domain type.
 */
export function mapPost(row: PostRowInput): Post {
  return {
    id: row.id,
    content: row.content,
    createdAt: toUtcIsoDateTime(row.created_at),
    parentPostId: row.parent_post_id,
    author: mapAccount(row.author),
  };
}

export function mapPostFromUnknown(value: unknown): Post {
  if (!isPostRow(value)) {
    throw new RepositoryError("Invalid post row shape from database");
  }
  return mapPost(value);
}

export function mapTimelinePost(row: TimelinePostRowInput): TimelinePost {
  return {
    ...mapPost(row),
    replyCount: row.replies[0].count,
  };
}

export function mapTimelinePostFromUnknown(value: unknown): TimelinePost {
  if (!isTimelinePostRow(value)) {
    throw new RepositoryError("Invalid timeline post row shape from database");
  }
  return mapTimelinePost(value);
}
