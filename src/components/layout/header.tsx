import Link from "next/link";

export function Header() {
  return (
    <header className="border-border bg-card/80 border-b backdrop-blur-sm">
      <div className="mx-auto flex h-14 w-full max-w-2xl items-center px-4">
        <Link
          href="/"
          className="text-foreground focus-visible:border-ring focus-visible:ring-ring/50 inline-flex items-center gap-2 rounded-md outline-none focus-visible:ring-3"
        >
          <span
            aria-hidden="true"
            className="bg-primary text-primary-foreground flex size-7 items-center justify-center rounded-md text-xs font-semibold"
          >
            AI
          </span>
          <span className="text-base font-semibold tracking-tight">
            AI Office SNS
          </span>
        </Link>
      </div>
    </header>
  );
}
