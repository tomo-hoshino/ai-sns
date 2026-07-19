import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { LoginForm } from "@/features/auth/components/login-form";
import { resolveSafeNextPath } from "@/features/auth/utils/safe-next-path";
import { getSessionUser } from "@/lib/supabase/get-session-user";

export const metadata: Metadata = {
  title: "ログイン | AI Office SNS",
  description: "メールのマジックリンクでログインします。",
};

type LoginPageProps = {
  searchParams: Promise<{
    next?: string | string[];
    error?: string | string[];
  }>;
};

function resolveErrorMessage(
  error: string | string[] | undefined,
): string | null {
  if (typeof error !== "string" || error.trim() === "") {
    return null;
  }
  if (error === "auth_callback_failed") {
    return "ログインリンクの確認に失敗しました。もう一度お試しください。";
  }
  return "ログインに失敗しました。もう一度お試しください。";
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const user = await getSessionUser();

  const nextPath = resolveSafeNextPath(
    typeof params.next === "string" ? params.next : undefined,
  );

  if (user !== null) {
    redirect(nextPath);
  }

  const errorMessage = resolveErrorMessage(params.error);

  return (
    <div className="flex flex-col gap-4">
      <LoginForm nextPath={nextPath} />
      {errorMessage !== null ? (
        <p className="text-destructive text-sm" role="alert">
          {errorMessage}
        </p>
      ) : null}
      <p className="text-muted-foreground text-sm">
        <Link
          href="/"
          className="text-foreground focus-visible:ring-ring underline-offset-4 hover:underline focus-visible:ring-3 focus-visible:outline-none"
        >
          タイムラインへ戻る
        </Link>
      </p>
    </div>
  );
}
