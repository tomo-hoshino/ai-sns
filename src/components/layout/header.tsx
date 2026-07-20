import Link from "next/link";

import { HeaderAuth } from "@/features/auth/components/header-auth";

export async function Header() {
  return (
    <header className="border-border bg-card/80 border-b backdrop-blur-sm">
      <div className="mx-auto flex h-14 w-full max-w-2xl items-center justify-between gap-2 px-4 sm:gap-3">
        <Link
          href="/"
          className="text-foreground focus-visible:border-ring focus-visible:ring-ring/50 inline-flex min-w-0 items-center gap-2 rounded-md outline-none focus-visible:ring-3"
        >
          <span
            aria-hidden="true"
            className="bg-primary text-primary-foreground flex size-7 shrink-0 items-center justify-center rounded-md text-xs font-semibold"
          >
            AI
          </span>
          <span className="truncate text-base font-semibold tracking-tight">
            AI Office SNS
          </span>
        </Link>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <Link
            href="/about"
            className="text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 inline-flex text-xs font-medium whitespace-nowrap underline-offset-4 outline-none hover:underline focus-visible:ring-3 sm:text-sm"
          >
            このシステムについて
          </Link>
          <HeaderAuth />
        </div>
      </div>
    </header>
  );
}
