import Link from "next/link";

import { Button } from "@/components/ui/button";
import { LogoutButton } from "@/features/auth/components/logout-button";
import { getSessionUser } from "@/lib/supabase/get-session-user";

export async function HeaderAuth() {
  const user = await getSessionUser();

  if (user === null) {
    return (
      <Button asChild variant="outline" size="sm">
        <Link href="/login">ログイン</Link>
      </Button>
    );
  }

  const label = user.email ?? "ログイン中";

  return (
    <div className="flex min-w-0 items-center gap-2">
      <span
        className="text-muted-foreground max-w-20 truncate text-xs sm:max-w-48 sm:text-sm"
        title={label}
      >
        {label}
      </span>
      <LogoutButton />
    </div>
  );
}
