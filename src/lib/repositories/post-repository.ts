import "server-only";

import type {
  Post,
  Thread,
  TimelinePageCursor,
  TimelinePost,
} from "@/types/post";

import { RepositoryError } from "@/lib/repositories/errors";
import {
  mapPostFromUnknown,
  mapTimelinePostFromUnknown,
} from "@/lib/repositories/map-post";
import { getSupabaseServerClient } from "@/lib/supabase/server";

const POST_WITH_AUTHOR_SELECT = `
  id,
  content,
  created_at,
  parent_post_id,
  author:profiles!posts_author_id_fkey (
    id,
    handle,
    display_name,
    bio,
    account_type,
    persona_key,
    avatar_path
  )
` as const;

// Use column hint for the self-FK. Constraint-name hint can miss in PostgREST
// schema cache even when posts_parent_post_id_fkey exists in generated types.
const TIMELINE_POST_SELECT = `
  ${POST_WITH_AUTHOR_SELECT},
  replies:posts!parent_post_id(count)
` as const;

export type FindTimelinePageParams = {
  limit: number;
  cursor?: TimelinePageCursor;
};

export type FindTimelinePageResult = {
  posts: TimelinePost[];
  hasMore: boolean;
};

export type InsertRootPostInput = {
  authorId: string;
  content: string;
};

export type InsertAiReplyInput = {
  authorId: string;
  parentPostId: string;
  content: string;
};

/**
 * Root posts only, newest first, with reply counts.
 * Fetches limit+1 rows to determine hasMore without a separate count query.
 */
export async function findTimelinePage(
  params: FindTimelinePageParams,
): Promise<FindTimelinePageResult> {
  const { limit, cursor } = params;
  if (!Number.isInteger(limit) || limit < 1) {
    throw new RepositoryError(
      "findTimelinePage limit must be a positive integer",
    );
  }

  const client = getSupabaseServerClient();
  let query = client
    .from("posts")
    .select(TIMELINE_POST_SELECT)
    .is("parent_post_id", null)
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(limit + 1);

  if (cursor) {
    // Composite key pagination for (created_at desc, id desc).
    // Quote timestamps so PostgREST does not split on `:`.
    query = query.or(
      `created_at.lt."${cursor.createdAt}",and(created_at.eq."${cursor.createdAt}",id.lt.${cursor.id})`,
    );
  }

  const { data, error } = await query;

  if (error) {
    throw new RepositoryError("Failed to load timeline page", { cause: error });
  }

  if (data === null) {
    throw new RepositoryError("Timeline page query returned null data");
  }

  const hasMore = data.length > limit;
  const pageRows = hasMore ? data.slice(0, limit) : data;
  const posts = pageRows.map((row) => mapTimelinePostFromUnknown(row));

  return { posts, hasMore };
}

/**
 * Inserts a root post (parent_post_id = null) and returns it with author.
 */
export async function insertRootPost(
  input: InsertRootPostInput,
): Promise<Post> {
  const client = getSupabaseServerClient();
  const { data, error } = await client
    .from("posts")
    .insert({
      author_id: input.authorId,
      content: input.content,
      parent_post_id: null,
    })
    .select(POST_WITH_AUTHOR_SELECT)
    .single();

  if (error) {
    throw new RepositoryError("Failed to insert root post", { cause: error });
  }

  return mapPostFromUnknown(data);
}

/**
 * Inserts an AI reply under a root post and returns it with author.
 */
export async function insertAiReply(input: InsertAiReplyInput): Promise<Post> {
  const client = getSupabaseServerClient();
  const { data, error } = await client
    .from("posts")
    .insert({
      author_id: input.authorId,
      content: input.content,
      parent_post_id: input.parentPostId,
    })
    .select(POST_WITH_AUTHOR_SELECT)
    .single();

  if (error) {
    throw new RepositoryError("Failed to insert AI reply", { cause: error });
  }

  return mapPostFromUnknown(data);
}

/**
 * Loads a root post and its direct replies (oldest first).
 * Returns null when the id is missing or refers to a reply post.
 */
export async function findThreadByRootId(
  rootPostId: string,
): Promise<Thread | null> {
  const client = getSupabaseServerClient();

  const { data: rootRow, error: rootError } = await client
    .from("posts")
    .select(POST_WITH_AUTHOR_SELECT)
    .eq("id", rootPostId)
    .is("parent_post_id", null)
    .maybeSingle();

  if (rootError) {
    throw new RepositoryError("Failed to load thread root", {
      cause: rootError,
    });
  }

  if (rootRow === null) {
    return null;
  }

  const root = mapPostFromUnknown(rootRow);

  const { data: replyRows, error: repliesError } = await client
    .from("posts")
    .select(POST_WITH_AUTHOR_SELECT)
    .eq("parent_post_id", rootPostId)
    .order("created_at", { ascending: true })
    .order("id", { ascending: true });

  if (repliesError) {
    throw new RepositoryError("Failed to load thread replies", {
      cause: repliesError,
    });
  }

  if (replyRows === null) {
    throw new RepositoryError("Thread replies query returned null data");
  }

  const replies = replyRows.map((row) => mapPostFromUnknown(row));

  return { root, replies };
}
