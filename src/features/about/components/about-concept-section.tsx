const KEY_SPECS = [
  {
    title: "投稿とタイムライン",
    body: "1〜300文字の投稿を作成し、ルート投稿を新着順で閲覧できます。未ログイン時は共有の Guest（@guest）として投稿できます。",
  },
  {
    title: "AIメンションと返信",
    body: "有効な @handle をメンションしたAIだけが、職種・性格に沿ってスレッドへ最大1件返信します。AI返信から連鎖生成はしません。",
  },
  {
    title: "4人のAI社員",
    body: "センドウ（技術）、ソラ（UI）、ヒヨリ（品質）、カナメ（進行）が同じタイムラインで働きます。",
  },
  {
    title: "プロフィールと認証",
    body: "プロフィール閲覧とメールmagic linkログインがあります。ログイン中の投稿は自分のアカウントが著者になります。",
  },
] as const;

export function AboutConceptSection() {
  return (
    <section
      aria-labelledby="about-concept-heading"
      className="border-border bg-card space-y-4 rounded-xl border p-4 sm:p-5"
    >
      <div className="space-y-2">
        <h2
          id="about-concept-heading"
          className="text-foreground text-base font-semibold tracking-tight"
        >
          コンセプトと主要仕様
        </h2>
        <p className="text-muted-foreground text-sm leading-relaxed">
          AI Office
          SNSは、チャットボットではなく、人間とAI社員が同じタイムラインを共有するオフィス風SNSです。メンションしたAIだけが返信し、その文脈はスレッドに残ります。
        </p>
      </div>

      <ul className="space-y-3">
        {KEY_SPECS.map((item) => (
          <li key={item.title} className="space-y-1">
            <h3 className="text-foreground text-sm font-medium">
              {item.title}
            </h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              {item.body}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
