"use client";

import { useId, useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { cn } from "@/lib/utils";
import { parseMagicLinkEmail } from "@/lib/validations/auth";

export type LoginFormProps = {
  nextPath?: string;
};

function buildEmailRedirectTo(nextPath: string): string {
  const origin = window.location.origin;
  const callbackUrl = new URL("/auth/callback", origin);
  callbackUrl.searchParams.set("next", nextPath);
  return callbackUrl.toString();
}

export function LoginForm({ nextPath = "/" }: LoginFormProps) {
  const emailId = useId();
  const statusId = useId();
  const [email, setEmail] = useState("");
  const [validationMessage, setValidationMessage] = useState<string | null>(
    null,
  );
  const [statusMessage, setStatusMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSent, setIsSent] = useState(false);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault();
    if (isSubmitting) {
      return;
    }

    const parsed = parseMagicLinkEmail(email);
    if (!parsed.success) {
      setValidationMessage(parsed.message);
      return;
    }

    setIsSubmitting(true);
    setValidationMessage(null);
    setStatusMessage("ログインリンクを送信しています…");

    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.auth.signInWithOtp({
        email: parsed.email,
        options: {
          emailRedirectTo: buildEmailRedirectTo(nextPath),
          shouldCreateUser: true,
        },
      });

      if (error !== null) {
        setValidationMessage(
          "ログインリンクの送信に失敗しました。しばらくしてから再度お試しください。",
        );
        setStatusMessage("");
        return;
      }

      setIsSent(true);
      setStatusMessage(
        `${parsed.email} にログインリンクを送信しました。メール内のリンクを開いてください。`,
      );
    } catch {
      setValidationMessage(
        "ログインリンクの送信に失敗しました。しばらくしてから再度お試しください。",
      );
      setStatusMessage("");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>ログイン</CardTitle>
        <CardDescription>
          メールアドレスにマジックリンクを送信します。初回送信でアカウントが作成されます。
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isSent ? (
          <p
            className="text-foreground text-sm"
            role="status"
            aria-live="polite"
          >
            {statusMessage}
          </p>
        ) : (
          <form
            className="flex flex-col gap-4"
            onSubmit={handleSubmit}
            noValidate
          >
            <div className="flex flex-col gap-1.5">
              <label htmlFor={emailId} className="text-sm font-medium">
                メールアドレス
              </label>
              <input
                id={emailId}
                name="email"
                type="email"
                autoComplete="email"
                inputMode="email"
                required
                disabled={isSubmitting}
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  if (validationMessage !== null) {
                    setValidationMessage(null);
                  }
                }}
                aria-invalid={validationMessage !== null}
                aria-describedby={
                  validationMessage !== null ? statusId : undefined
                }
                className={cn(
                  "border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 disabled:bg-input/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 flex h-9 w-full rounded-lg border bg-transparent px-2.5 text-base transition-colors outline-none focus-visible:ring-3 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:ring-3 md:text-sm",
                )}
                placeholder="you@example.com"
              />
              {validationMessage !== null ? (
                <p
                  id={statusId}
                  className="text-destructive text-sm"
                  role="alert"
                >
                  {validationMessage}
                </p>
              ) : null}
            </div>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="self-start"
            >
              {isSubmitting ? "送信中…" : "ログインリンクを送る"}
            </Button>
            {statusMessage !== "" && validationMessage === null ? (
              <p className="sr-only" aria-live="polite">
                {statusMessage}
              </p>
            ) : null}
          </form>
        )}
      </CardContent>
    </Card>
  );
}
