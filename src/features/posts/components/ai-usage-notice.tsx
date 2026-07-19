const USAGE_ESTIMATE_ROWS = [
  {
    pattern: "短い投稿・返信なし文脈",
    costPerCall: "~$0.002",
    callsPerFiveDollars: "約2,000回超",
  },
  {
    pattern: "普通の投稿",
    costPerCall: "~$0.0025",
    callsPerFiveDollars: "約1,500〜2,000回",
  },
  {
    pattern: "長文＋返信がいくつかある",
    costPerCall: "~$0.004",
    callsPerFiveDollars: "約1,000回前後",
  },
  {
    pattern: "かなり重い文脈",
    costPerCall: "~$0.01",
    callsPerFiveDollars: "約400〜500回",
  },
] as const;

/**
 * Static operator-facing note about OpenAI API credit usage for AI replies.
 */
export function AiUsageNotice() {
  return (
    <aside
      role="note"
      aria-labelledby="ai-usage-notice-heading"
      className="border-border bg-muted/40 text-muted-foreground space-y-3 rounded-lg border px-3 py-2.5 text-sm"
    >
      <div className="space-y-1">
        <h2
          id="ai-usage-notice-heading"
          className="text-foreground text-sm font-medium"
        >
          AI返信について
        </h2>
        <p>
          AI社員の返信には OpenAI API
          のクレジットを使用します。クレジット上限に達するとAI返信は失敗しますが、人間の投稿は残ります。続行する場合は
          OpenAI の管理画面でクレジットを追加してください。
        </p>
      </div>

      <div className="space-y-2">
        <h3
          id="ai-usage-estimate-heading"
          className="text-foreground text-sm font-medium"
        >
          $5で何回くらい使えるか（Luna）
        </h3>
        <div className="border-border overflow-x-auto rounded-md border bg-background">
          <table
            aria-labelledby="ai-usage-estimate-heading"
            className="w-full min-w-[20rem] border-collapse text-left text-xs sm:text-sm"
          >
            <thead>
              <tr className="border-border border-b">
                <th
                  scope="col"
                  className="text-foreground px-2.5 py-2 font-medium"
                >
                  利用パターン
                </th>
                <th
                  scope="col"
                  className="text-foreground px-2.5 py-2 font-medium"
                >
                  1回あたり目安
                </th>
                <th
                  scope="col"
                  className="text-foreground px-2.5 py-2 font-medium"
                >
                  $5で可能な回数（目安）
                </th>
              </tr>
            </thead>
            <tbody>
              {USAGE_ESTIMATE_ROWS.map((row) => (
                <tr
                  key={row.pattern}
                  className="border-border border-b last:border-b-0"
                >
                  <td className="px-2.5 py-2">{row.pattern}</td>
                  <td className="px-2.5 py-2 whitespace-nowrap">
                    {row.costPerCall}
                  </td>
                  <td className="px-2.5 py-2">{row.callsPerFiveDollars}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs">
          目安はモデル
          <code className="text-foreground">gpt-5.6-luna</code>
          前提の概算です。実測は OpenAI の Usage
          画面で確認してください。
        </p>
      </div>
    </aside>
  );
}
