import Link from "next/link";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { PostContent } from "@/features/posts/components/post-content";
import {
  getAiBadgeClass,
  getAuthorBorderClass,
} from "@/features/posts/utils/persona-styles";
import { formatRelativeTime } from "@/features/posts/utils/format-relative-time";
import { cn } from "@/lib/utils";
import type { Account } from "@/types/account";
import type { Post } from "@/types/post";

export type PostCardProps = {
  post: Post;
  aiAccounts: readonly Account[];
  replyCount?: number;
  className?: string;
};

function getAvatarFallbackLabel(author: Account): string {
  const fromDisplayName = Array.from(author.displayName)[0];
  if (fromDisplayName !== undefined) {
    return fromDisplayName;
  }

  const fromHandle = Array.from(author.handle)[0];
  return fromHandle ?? "?";
}

function getThreadHref(post: Post): string {
  const rootPostId = post.parentPostId ?? post.id;
  return `/posts/${rootPostId}`;
}

function getProfileHref(handle: string): string {
  return `/profiles/${handle}`;
}

const profileLinkClassName =
  "rounded-sm outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-3";

export function PostCard({
  post,
  aiAccounts,
  replyCount,
  className,
}: PostCardProps) {
  const { author } = post;
  const isAi = author.accountType === "ai";
  const relativeTime = formatRelativeTime(post.createdAt);
  const threadHref = getThreadHref(post);
  const profileHref = getProfileHref(author.handle);
  const profileLinkLabel = `${author.displayName}（@${author.handle}）のプロフィール`;

  return (
    <Card
      size="sm"
      className={cn("border-l-4", getAuthorBorderClass(author), className)}
    >
      <CardHeader className="flex flex-row items-start gap-3 space-y-0">
        <Link
          href={profileHref}
          aria-label={profileLinkLabel}
          className={cn("mt-0.5 shrink-0 rounded-full", profileLinkClassName)}
        >
          <Avatar size="default">
            <AvatarImage src={author.avatarPath} alt="" />
            <AvatarFallback aria-hidden="true">
              {getAvatarFallbackLabel(author)}
            </AvatarFallback>
          </Avatar>
        </Link>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <Link
              href={profileHref}
              className={cn(
                "text-foreground truncate font-medium underline-offset-4 hover:underline",
                profileLinkClassName,
              )}
            >
              {author.displayName}
            </Link>
            {isAi && author.personaKey !== null ? (
              <Badge
                variant="secondary"
                className={cn("border-0", getAiBadgeClass(author.personaKey))}
              >
                AI
              </Badge>
            ) : null}
          </div>
          <div className="text-muted-foreground mt-0.5 flex flex-wrap items-center gap-x-2 text-sm">
            <Link
              href={profileHref}
              className={cn(
                "underline-offset-4 hover:underline",
                profileLinkClassName,
              )}
            >
              {`@${author.handle}`}
            </Link>
            <span aria-hidden="true">·</span>
            <time dateTime={post.createdAt}>{relativeTime}</time>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <PostContent content={post.content} aiAccounts={aiAccounts} />
      </CardContent>

      <CardFooter className="justify-between gap-2">
        <span className="text-muted-foreground text-sm">
          {replyCount === undefined ? null : `返信 ${replyCount}件`}
        </span>
        <Link
          href={threadHref}
          aria-label={`@${author.handle}の投稿の返信を表示`}
          className="text-foreground focus-visible:border-ring focus-visible:ring-ring/50 text-sm font-medium underline-offset-4 hover:underline focus-visible:ring-3"
        >
          返信を表示
        </Link>
      </CardFooter>
    </Card>
  );
}
