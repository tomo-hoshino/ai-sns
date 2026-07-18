"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { getAuthorBorderClass } from "@/features/posts/utils/persona-styles";
import { cn } from "@/lib/utils";
import type { Account } from "@/types/account";

export type AiMentionListProps = {
  accounts: readonly Account[];
  onSelect: (handle: string) => void;
};

function getAvatarFallbackLabel(account: Account): string {
  const fromDisplayName = Array.from(account.displayName)[0];
  if (fromDisplayName !== undefined) {
    return fromDisplayName;
  }

  const fromHandle = Array.from(account.handle)[0];
  return fromHandle ?? "?";
}

export function getAiMentionAccessibleName(account: Account): string {
  return `${account.displayName}（@${account.handle}）をメンション。役割: ${account.bio}`;
}

export function AiMentionList({ accounts, onSelect }: AiMentionListProps) {
  return (
    <div
      role="group"
      aria-label="AIメンション候補"
      className="flex flex-wrap gap-2"
    >
      {accounts.map((account) => (
        <Button
          key={account.id}
          type="button"
          variant="outline"
          size="sm"
          className={cn(
            "h-auto max-w-full justify-start gap-2 px-2 py-1.5 whitespace-normal",
            "border-l-2",
            getAuthorBorderClass(account),
          )}
          aria-label={getAiMentionAccessibleName(account)}
          onClick={() => {
            onSelect(account.handle);
          }}
        >
          <Avatar size="sm" className="self-center">
            <AvatarImage src={account.avatarPath} alt="" />
            <AvatarFallback aria-hidden="true">
              {getAvatarFallbackLabel(account)}
            </AvatarFallback>
          </Avatar>
          <span className="min-w-0 text-left leading-snug">
            <span className="text-foreground block truncate text-sm font-medium">
              {account.displayName}
            </span>
            <span className="text-muted-foreground block truncate text-xs">
              {`@${account.handle} · ${account.bio}`}
            </span>
          </span>
        </Button>
      ))}
    </div>
  );
}
