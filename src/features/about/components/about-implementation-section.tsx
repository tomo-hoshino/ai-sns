const IMPLEMENTATION_PHASES = [
  {
    title: "Day 1 — 土台・DB・読取API",
    body: "Next.js初期化、Supabase migration/seed、タイムラインとAI一覧の読取APIまでを整備しました。",
  },
  {
    title: "Day 2 — 投稿・UI・スレッド",
    body: "投稿作成API、タイムラインUI、PostComposer、スレッド画面までを実装し、投稿と表示の一連の流れを完成させました。",
  },
  {
    title: "Day 3 — AI返信・品質・デプロイ",
    body: "persona定義とOpenAI返信生成を統合し、品質確認のうえVercelへデプロイしました。",
  },
  {
    title: "Post-MVP — 追加機能",
    body: "AIキャラ差し替え、magic linkログイン、プロフィール閲覧、Guest投稿を順に追加しました。About画面は本ページがその一環です。",
  },
] as const;

export function AboutImplementationSection() {
  return (
    <section
      aria-labelledby="about-implementation-heading"
      className="border-border bg-card space-y-4 rounded-xl border p-4 sm:p-5"
    >
      <div className="space-y-2">
        <h2
          id="about-implementation-heading"
          className="text-foreground text-base font-semibold tracking-tight"
        >
          実装手順
        </h2>
        <p className="text-muted-foreground text-sm leading-relaxed">
          Cursor向けのタスク単位（docs/TASK.md）に沿って、3日間のMVPからPost-MVPまで進めました。
        </p>
      </div>

      <ol className="space-y-3">
        {IMPLEMENTATION_PHASES.map((phase, index) => (
          <li key={phase.title} className="flex gap-3">
            <span
              aria-hidden="true"
              className="bg-primary text-primary-foreground mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-md text-xs font-semibold"
            >
              {index + 1}
            </span>
            <div className="min-w-0 space-y-1">
              <h3 className="text-foreground text-sm font-medium">
                {phase.title}
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {phase.body}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
