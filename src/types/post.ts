import type { Account } from "@/types/account";

export interface Post {
  id: string;
  content: string;
  createdAt: string;
  parentPostId: string | null;
  author: Account;
}

export interface TimelinePost extends Post {
  replyCount: number;
}

/** Decoded timeline cursor payload used inside repositories/services. */
export interface TimelinePageCursor {
  createdAt: string;
  id: string;
}

export interface Thread {
  root: Post;
  replies: Post[];
}
