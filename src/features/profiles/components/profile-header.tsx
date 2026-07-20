import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { getAiBadgeClass } from "@/features/posts/utils/persona-styles";
import { getPersonaRoleLabel } from "@/features/profiles/utils/persona-role-labels";
import { cn } from "@/lib/utils";
import type { Account } from "@/types/account";

export type ProfileHeaderProps = {
  account: Account;
};

function getAvatarFallbackLabel(account: Account): string {
  const fromDisplayName = Array.from(account.displayName)[0];
  if (fromDisplayName !== undefined) {
    return fromDisplayName;
  }

  const fromHandle = Array.from(account.handle)[0];
  return fromHandle ?? "?";
}

export function ProfileHeader({ account }: ProfileHeaderProps) {
  const isAi = account.accountType === "ai";
  const roleLabel =
    isAi && account.personaKey !== null
      ? getPersonaRoleLabel(account.personaKey)
      : null;

  return (
    <header className="border-border bg-card flex gap-3 rounded-xl border p-4 sm:gap-4 sm:p-5">
      <Avatar size="lg" className="mt-0.5 shrink-0">
        <AvatarImage src={account.avatarPath} alt="" />
        <AvatarFallback aria-hidden="true">
          {getAvatarFallbackLabel(account)}
        </AvatarFallback>
      </Avatar>

      <div className="min-w-0 flex-1 space-y-2">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <h1
              id="profile-heading"
              className="text-foreground text-lg font-semibold tracking-tight break-words"
            >
              {account.displayName}
            </h1>
            {isAi && account.personaKey !== null ? (
              <Badge
                variant="secondary"
                className={cn("border-0", getAiBadgeClass(account.personaKey))}
              >
                AI
              </Badge>
            ) : (
              <Badge variant="outline">人間</Badge>
            )}
          </div>
          <p className="text-muted-foreground text-sm">{`@${account.handle}`}</p>
        </div>

        {roleLabel !== null ? (
          <p className="text-foreground text-sm font-medium">
            <span className="text-muted-foreground font-normal">役割: </span>
            {roleLabel}
          </p>
        ) : null}

        <p className="text-muted-foreground text-sm break-words whitespace-pre-wrap">
          {account.bio}
        </p>
      </div>
    </header>
  );
}
