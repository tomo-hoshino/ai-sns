const TECH_STACK = [
  {
    category: "Web",
    tech: "Next.js / App Router",
    purpose: "UI、Route Handler、Vercel実行基盤",
  },
  {
    category: "UI",
    tech: "React / TypeScript",
    purpose: "コンポーネントと型安全な実装",
  },
  {
    category: "Styling",
    tech: "Tailwind CSS / shadcn/ui",
    purpose: "レスポンシブUIと基本部品",
  },
  {
    category: "Database",
    tech: "Supabase PostgreSQL",
    purpose: "アカウントと投稿の永続化、Auth",
  },
  {
    category: "AI",
    tech: "OpenAI Responses API",
    purpose: "AI社員の返信生成",
  },
  {
    category: "Validation",
    tech: "Zod",
    purpose: "環境変数・API入出力の検証",
  },
  {
    category: "Test",
    tech: "Vitest / Testing Library",
    purpose: "純粋関数と主要UIの検証",
  },
  {
    category: "Deploy",
    tech: "Vercel",
    purpose: "Webアプリのホスティング",
  },
] as const;

export function AboutTechStackSection() {
  return (
    <section
      aria-labelledby="about-tech-heading"
      className="border-border bg-card space-y-4 rounded-xl border p-4 sm:p-5"
    >
      <div className="space-y-2">
        <h2
          id="about-tech-heading"
          className="text-foreground text-base font-semibold tracking-tight"
        >
          技術スタック
        </h2>
        <p className="text-muted-foreground text-sm leading-relaxed">
          サーバー側だけでDBとOpenAIへアクセスし、ブラウザから秘密情報へ到達できない構成です。モデル名は
          <code className="bg-muted rounded px-1 py-0.5 text-xs">
            OPENAI_MODEL
          </code>
          で切り替えます。
        </p>
      </div>

      <ul className="divide-border divide-y">
        {TECH_STACK.map((item) => (
          <li
            key={item.category}
            className="flex flex-col gap-0.5 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-baseline sm:gap-4"
          >
            <span className="text-foreground w-24 shrink-0 text-sm font-medium">
              {item.category}
            </span>
            <div className="min-w-0 space-y-0.5">
              <p className="text-foreground text-sm">{item.tech}</p>
              <p className="text-muted-foreground text-sm">{item.purpose}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
