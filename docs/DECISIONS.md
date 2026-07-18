# AI Office SNS — 設計判断記録

## 1. 運用方法

本書は「なぜその設計にしたか」を残す軽量なADR（Architecture Decision Record）です。

- `Accepted`: 現在採用中
- `Superseded`: 後続判断に置き換え済み
- `Proposed`: 検討中で未採用

判断を変更するときは過去の本文を削除せず、新しいADRを追加して `Superseded by ADR-xxx` と記録します。

## 判断一覧

| ID | タイトル | Status | 決定日 |
| --- | --- | --- | --- |
| ADR-001 | DatabaseにSupabaseを採用する | Accepted | 2026-07-18 |
| ADR-002 | MVPに認証を入れない | Accepted | 2026-07-18 |
| ADR-003 | AI返信にOpenAI Responses APIを採用する | Accepted | 2026-07-18 |
| ADR-004 | 人間投稿とAI返信を300文字に制限する | Accepted | 2026-07-18 |

---

## ADR-001: DatabaseにSupabaseを採用する

### Status

Accepted

### Context

3日間で、アカウント、投稿、親子関係、時系列取得を永続化する必要があります。認証はMVP対象外ですが、将来は複数ユーザーと権限制御を追加する可能性があります。個人開発のため、DB serverの構築・監視に時間を使えません。

### Decision

Supabaseのmanaged PostgreSQLを採用します。Next.jsのサーバー専用repositoryから `@supabase/supabase-js` とservice role keyを使ってアクセスします。`profiles` と `posts` にはRLSを有効化しますが、認証なしMVPでは公開policyを作らず、ブラウザからのDB直接操作を許可しません。

### 理由

- DB作成、SQL Editor、migration、管理画面を短時間で準備できる
- PostgreSQLのFK、CHECK、部分indexがSNSの親子データに適している
- 将来Supabase Authを追加した場合、同じDBとRLSを継続利用できる
- Vercel上のNext.jsからHTTPSで利用でき、別のAPI serverを運用しなくてよい
- SQLをmigrationとしてGit管理できる

### Consequences

良い影響:

- Day 1から永続化へ集中できる
- DB制約とTypeScript validationの二重防御ができる
- 管理UIでMVPデータを確認できる

注意点:

- service role keyが漏れるとRLSを迂回できるため、必ずserver-onlyにする
- Supabase SDKのquery表現へ依存するため、repositoryの外へSDK型を漏らさない
- 無料枠や接続上限は将来の本番運用前に再評価する

### Rejected alternatives

| 代替 | 見送った理由 |
| --- | --- |
| Vercel Postgres等の別managed DB | 将来のAuth/RLSまで含めた一体性が今回の構想に合う |
| Firebase / Firestore | thread、FK、集計をrelationalに扱う方が単純 |
| SQLite | Vercelのserverless filesystemで永続DBとして扱えない |
| Prisma追加 | 2テーブルMVPに対して生成・設定・抽象化が増える |

---

## ADR-002: MVPに認証を入れない

### Status

Accepted

### Context

本MVPの価値検証は「AI社員をメンションすると、その人格でSNSに返信が残るか」です。ログイン、signup、session、ユーザー別policyを入れると、3日間の相当部分を本質ではない導線へ使うことになります。

### Decision

MVPは認証を実装せず、すべての人間投稿をseed済みの固定アカウント `@you` として保存します。人間投稿はNext.js Route Handlerだけが作成します。デモ・個人検証を目的とし、機密情報を投稿しません。

### 理由

- 最短でconceptの体験を確認できる
- session管理、Auth UI、password reset、RLS policy設計をMVPから除外できる
- 認証追加前後でAI返信serviceの大部分を再利用できる

### Consequences

良い影響:

- Day 2までに投稿、表示、threadへ到達しやすい
- テストケースが固定ユーザーに絞られる

リスク:

- 誰が投稿したかを識別できない
- 公開URLを知る人がOpenAI API利用を発生させられる
- spam、abuse、ユーザー別削除へ対応できない

MVPでの緩和策:

- OpenAI projectの月額予算と使用量アラートを設定する
- `AI_REPLIES_ENABLED` を緊急停止スイッチにする
- API keyとservice role keyをサーバーだけに置く
- 機密情報を入力しないことをREADMEまたは画面へ明記する
- 長期公開や不特定多数への告知を行う前に認証を追加する

### 認証追加の開始条件

次のいずれかを行う時点でADRを追加し、Supabase AuthとRLS policyを設計します。

- 複数人が継続利用する
- 投稿者ごとのデータや設定を持つ
- 投稿編集・削除を追加する
- 社内情報や個人情報を扱う
- デモを越えて一般公開する

### Rejected alternatives

| 代替 | 見送った理由 |
| --- | --- |
| Supabase Authを最初から実装 | 価値検証に直接必要なく、3日間のscopeを圧迫する |
| ブラウザlocal ID | 本人性を保証せず、後のAuth移行にも大きな利点がない |
| Basic認証 | アプリのユーザー概念とは別物で、Vercel設定も含め追加作業になる |

---

## ADR-003: AI返信にOpenAI Responses APIを採用する

### Status

Accepted

### Context

4つのAI社員が、同じ投稿に対して異なる役割・性格・話し方で日本語返信を作る必要があります。MVPではtool calling、RAG、長期memory、画像生成は不要です。Node.js/TypeScriptから安全かつ少ないコードでtext生成を行う必要があります。

### Decision

公式OpenAI Node SDKのResponses APIを採用します。

- `instructions`: [PROMPTS.md](./PROMPTS.md) のAI別system prompt
- `input`: 元投稿と既存threadを「信頼しないデータ」として明示したtext
- `model`: `OPENAI_MODEL` 環境変数
- `store`: `false`
- output: SDKの `output_text` を取得し、1〜300文字へ正規化

初期設定例は、短文SNS返信のcostとlatencyを優先して `gpt-5.6-luna` とします。ただしモデル名はコードへ固定せず、利用可否・品質・費用に応じて環境変数だけで変更します。

### 理由

- OpenAIは新規のtext生成にResponses APIを案内している
- `instructions` と `input` を分け、AI personaとユーザー投稿の境界を明確にできる
- 公式TypeScript SDKがあり、responseを型安全に扱える
- 4 personaを同じAPI/SDKで実装できる
- modelを環境変数にすることで、コード変更なしにcost/qualityを調整できる

参考:

- [Text generation — OpenAI API](https://developers.openai.com/api/docs/guides/text)
- [Migrate to the Responses API — OpenAI API](https://developers.openai.com/api/docs/guides/migrate-to-responses)

### Consequences

良い影響:

- AI provider統合の実装量が少ない
- promptをGit管理し、人格変更をreviewできる
- 複数AI生成を同じ関数で並列実行できる

注意点:

- 従量課金と外部API latencyが発生する
- provider障害時に返信が生成されない
- model更新で文体や出力傾向が変わる可能性がある
- ユーザー投稿を外部APIへ送るため、機密情報を扱わない

対応:

- 人間投稿を先に保存し、AI失敗と分離する
- AI単位で `Promise.allSettled` を使う
- timeout/失敗を安全なerror codeへ変換する
- 月額予算・アラート・停止スイッチを設定する
- promptのcharacter testを保持する

### Rejected alternatives

| 代替 | 見送った理由 |
| --- | --- |
| Chat Completions API | 利用可能だが、新規実装ではResponses APIを優先する |
| 複数LLM provider対応 | MVPで使わないinterface・設定・testが増える |
| self-hosted model | 3日でinfraと品質調整を行うのは不合理 |
| モック返信だけ | conceptの核心である人格付き生成を検証できない |

---

## ADR-004: 人間投稿とAI返信を300文字に制限する

### Status

Accepted

### Context

SNSらしい短いやり取りにしつつ、日本語で相談・理由・次の行動を表現できる長さが必要です。入力とAI出力に上限がないと、UIが長文化し、OpenAI APIのcost/latencyも予測しづらくなります。

### Decision

人間投稿とAI返信の本文を、ともにtrim後1〜300文字へ制限します。

- UI: `Array.from(content).length` で残り文字数を表示し、301文字以上を送信不可にする
- API: 同じ数え方を使うZod refinementで拒否する
- DB: `varchar(300)` と `char_length(btrim(content)) between 1 and 300`
- AI: promptで300文字以内を要求し、最終防御としてUnicode単位で300文字へ切り詰める

### 理由

- 140文字では技術的な理由や次の行動を含めにくい
- 280文字はURL独自カウントなどX固有仕様を連想させるため、その互換実装を避ける
- 500文字以上ではtimelineの一覧性が落ち、AI返信のtoken消費が増える
- 300は日本語の短文相談と簡潔な専門回答のバランスがよい
- 人間とAIを同じ上限にして、同じPost componentとDB制約を使える

### Consequences

良い影響:

- timelineの密度とSNSらしさを維持できる
- AIの出力costと待ち時間を抑えやすい
- validationを3層で一貫させやすい

注意点:

- 詳細なコード、長い要件、ログ全文は投稿できない
- 結合文字やgrapheme clusterの見た目とcode point数が完全一致しない場合がある
- AI出力の強制切り詰めで文末が不自然になる可能性がある

MVPでは `Intl.Segmenter` を使ったgrapheme完全対応やURL短縮ルールを導入しません。UIとAPIが同じ `Array.from` 基準であることを優先します。

### Rejected alternatives

| 代替 | 見送った理由 |
| --- | --- |
| 280文字 | X固有の文字count互換を期待させ、要件が増える |
| 500文字 | timelineの一覧性とAI costの予測性が下がる |
| 人間とAIで別上限 | UI、DB、testの条件分岐が増える |
| 上限なし | abuse、cost、表示崩れのriskが高い |
