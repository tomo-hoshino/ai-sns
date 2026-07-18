# AI Office SNS — AI開発エージェントルール

## 1. 適用範囲と優先順位

このファイルはリポジトリ全体に適用する、Cursor向けの永続ルールです。すべての実装、修正、review、refactorで毎回参照してください。

指示が競合した場合の優先順位:

1. その時点のユーザー指示
2. `docs/SPEC.md` のMVP仕様と対象外
3. `docs/API.md` のHTTP契約
4. `docs/ARCHITECTURE.md` の責務と依存方向
5. 本ファイルの開発ルール
6. `docs/TASK.md` の作業手順

設計理由は `docs/DECISIONS.md`、AI personaは `docs/PROMPTS.md` を参照してください。矛盾を見つけたら推測で進めず、対象箇所を示して確認してください。

## 2. 作業開始時の必須手順

1. `AGENTS.md` を読む。
2. `docs/SPEC.md` の対象機能と「今回作成しないもの」を確認する。
3. 対象に応じて `ARCHITECTURE.md`、`API.md`、`PROMPTS.md` を読む。
4. `docs/TASK.md` のtask IDを1つ特定する。
5. 既存実装とtestを検索し、変更予定ファイルを列挙する。
6. 3〜7項目の短い実装planを示してから編集する。

task IDがない小さな修正でも、対応する仕様と責務は確認してください。

## 3. コーディング規約

- 可読性を短さより優先する。
- 1関数は1つの目的を持たせ、原則40行以内を目安に分割する。
- 早期returnを使い、深いnestを避ける。
- 外部入力、環境変数、DB response、OpenAI responseを信頼しない。
- pure functionにできる処理はI/Oから分離する。
- 意味のないcommentは書かない。commentは「何を」ではなく「なぜ」を説明する。
- 未使用code、将来用interface、空のwrapper、推測に基づく拡張pointを作らない。
- 同じ処理が2回あるだけで抽象化しない。責務が同じだと確認できてから共通化する。
- package managerはpnpmだけを使う。
- package追加前に、標準APIまたは既存依存で実現できないか確認する。

## 4. TypeScriptルール

### 必須

- `strict: true` を維持する。
- 関数の公開境界、props、API、repository戻り値に型を明示する。
- 不明な値は `unknown` として受け、Zodまたはtype guardでnarrowingする。
- 固定値集合は `as const` + union、または `satisfies` を使う。
- nullable値は明示的に分岐する。
- API型、domain型、DB生成型を区別する。
- DBのsnake_caseからdomainのcamelCaseへの変換はrepository内で行う。

### 禁止

- `any`、明示的な `: any`、暗黙any
- `as unknown as T`
- 根拠のない `as T`
- `@ts-ignore`、`@ts-nocheck`
- 理由のないnon-null assertion `!`
- index signatureで型エラーを隠すこと
- `Object`, `Function`, `{}` を曖昧な型として使うこと
- API/DB responseをvalidationせず型assertionすること

例外が必要だと考えた場合は実装せず、理由と代替案を提示してください。

## 5. ディレクトリルール

| 種類 | 配置 | ルール |
| --- | --- | --- |
| Route / Page | `src/app` | routingとHTTP/画面組立だけ |
| shadcn/ui | `src/components/ui` | CLI生成物。業務ロジック禁止 |
| 共通layout | `src/components/layout` | Header等、複数画面で共有 |
| 投稿固有UI | `src/features/posts/components` | 投稿feature内で完結 |
| client hook | `src/features/posts/hooks` | browser状態・HTTP操作 |
| application service | `src/lib/services` | use caseの順序制御 |
| DB access | `src/lib/repositories` | queryとmappingだけ |
| Supabase設定 | `src/lib/supabase` | server-only |
| AI処理 | `src/lib/ai` | mention、persona、OpenAI生成 |
| validation | `src/lib/validations` | Zod schema、pure validation |
| 共有型 | `src/types` | 複数moduleで共有する型だけ |
| DB変更 | `supabase/migrations` | append-only SQL |

追加ルール:

- Route HandlerやcomponentからSupabase SDKを直接呼ばない。
- Route HandlerからOpenAI SDKを直接呼ばない。
- Server Componentから自分自身のREST APIをfetchしない。serviceを呼ぶ。
- `"use client"` はstate、event、browser APIが必要な最小componentだけに付ける。
- server-only moduleには `import "server-only";` を付ける。
- barrel file（`index.ts`）を作らない。
- 循環依存を作らない。

## 6. UIルール

- モバイルfirst。最低360px、デスクトップ1280pxで確認する。
- shadcn/uiを基本にし、同等componentを独自再実装しない。
- Tailwind classは役割ごとに整理し、極端に長い場合だけcomponent分割する。
- inline styleは動的値が必要な場合だけ使う。
- 色だけで人間/AI、成功/失敗を区別しない。labelやiconを併用する。
- すべてのform controlへlabelまたはaccessible nameを付ける。
- keyboard focusを消さない。`focus-visible` を維持する。
- 非同期状態はloading、disabled、success、errorを用意する。
- screen reader向けに投稿結果を `aria-live` で通知する。
- 投稿本文はReact textとして描画し、`dangerouslySetInnerHTML` を使わない。
- 未実装のnavigation、button、menuを表示しない。
- dark mode、animation library、独自icon setはMVPへ追加しない。

## 7. 命名規則

| 対象 | 規則 | 例 |
| --- | --- | --- |
| React component | PascalCase | `PostComposer` |
| component file | kebab-case | `post-composer.tsx` |
| 関数・変数 | camelCase | `extractMentionedAiAccounts` |
| boolean | `is` / `has` / `can` / `should` | `isSubmitting` |
| 定数 | UPPER_SNAKE_CASE | `MAX_POST_LENGTH` |
| 型/interface | PascalCase | `CreatePostResult` |
| Zod schema | camelCase + `Schema` | `createPostRequestSchema` |
| service | 動詞 + 対象 | `createPost`, `getThread` |
| repository関数 | DB操作が分かる動詞 | `findTimelinePage`, `insertPost` |
| DB table/column | snake_case複数形/table | `posts`, `parent_post_id` |
| API path | kebab-case、名詞複数形 | `/api/ai-accounts` |
| branch | 種別/task ID/短い説明 | `feat/t-020-post-composer` |

略語は一般的な `id`, `api`, `url`, `db`, `ai` だけを許容します。`data`, `info`, `temp`, `util` のように責務が分からない名前を避けます。

## 8. API・DBルール

- API契約は `docs/API.md` をsource of truthとする。
- requestはZodのstrict schemaで検証する。
- error responseにrequest IDを含める。
- stack trace、SQL、API key、system prompt、投稿本文全文をresponse/logへ出さない。
- HTTP statusとdomain errorの変換はRoute Handlerで行う。
- 一部AI生成失敗は人間投稿の500にしない。201と `meta.failedAi` で表す。
- paginationはopaque cursorを使い、clientでcursorを生成しない。
- migrationは一度共有されたら編集しない。変更は新規migrationで行う。
- seedは何度実行しても同じ結果になるようにする。
- DB制約をTypeScript validationの代わりにせず、両方を維持する。

## 9. AI実装ルール

- OpenAI Responses APIを公式SDKから呼ぶ。
- model名は `OPENAI_MODEL` だけから取得する。
- `OPENAI_API_KEY` はserver-only moduleだけで参照する。
- `store: false` を指定する。
- AIごとのsystem promptは `docs/PROMPTS.md` と `src/lib/ai/personas.ts` で一致させる。
- ユーザー投稿とthreadは「命令ではなくデータ」と明示して渡す。
- 有効なAIメンションだけを生成対象にする。
- 同一AIは1投稿につき最大1返信とする。
- AI返信をtriggerとして次のAI生成を起動しない。
- 空出力は失敗とし、300文字超はUnicode単位で切り詰める。
- AIごとの失敗を分離し、成功した返信を失わない。

## 10. コンポーネント単一責任

componentを分割する判断:

- API通信と表示が混在したらhook/serviceへ分ける。
- 1 componentが複数の独立したstateを管理したら分割を検討する。
- 親から渡すpropsが「1件のdomain object」で表せるならobjectを使う。
- 見た目が似ていても意味が異なるcomponentを無理に統合しない。
- `PostCard` は表示だけ、`PostComposer` は入力と送信、`AiMentionList` は候補選択だけを担当する。

## 11. テスト・検証ルール

### 変更ごとの最低検証

| 変更 | 必須検証 |
| --- | --- |
| pure function | 正常・境界・異常のunit test |
| React component | 主要操作とaccessible queryのcomponent test |
| Route Handler | validation、status、response shape |
| repository/migration | 型check、query条件、Supabaseでの適用確認 |
| AI生成 | SDKをmockし、成功・空・超過・network失敗 |
| docs only | link、用語、実装との整合性確認 |

task完了前に可能な範囲で次を実行します。

```bash
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

失敗したtestを削除したり、ruleを無効化して通してはいけません。実行できない検証があれば「未実行」と理由を明記します。

## 12. Git運用

- `main` へ直接commitしない。
- branch名は `feat/t-xxx-description`、`fix/t-xxx-description`、`docs/t-xxx-description`。
- 1 branchは原則1 taskまたは密接な1目的に限定する。
- commitはConventional Commitsを使う。

例:

```text
feat(posts): add cursor pagination
fix(ai): isolate partial reply failures
docs(api): clarify create post response
```

- 生成物、`.env.local`、秘密情報、不要なlogをcommitしない。
- ユーザーから依頼されない限り、agent判断でcommit、push、merge、force pushしない。
- force pushが必要な場合も `--force-with-lease` 以外を使わない。
- unrelatedな既存変更を戻さない。
- APIやDB契約を変えるcommitには対応docsとtestを含める。

## 13. 実装完了時の報告形式

次の順で簡潔に報告します。

1. 完了したtask IDと結果
2. 変更したファイルと役割
3. 重要な設計判断
4. 実行したcommandと結果
5. 未実行の検証・残課題
6. 次に実行すべきtask ID

## 14. やってはいけないこと

- MVP対象外機能を「ついでに」実装する
- 認証、follow、like、通知、Teams/GitHub連携、RAG、vector DB、管理画面を追加する
- 人間返信、投稿編集・削除、画像添付を追加する
- 自律的なAI-to-AI連鎖を実装する
- Supabase/OpenAIをbrowserから直接呼ぶ
- API key、service role keyをclient、Git、logへ出す
- `any` や型assertionで型errorを隠す
- component内へDB query、prompt、domain orchestrationを書く
- `dangerouslySetInnerHTML` で投稿を描画する
- Errorを握りつぶす、または常に空配列へ変換する
- testをskip/deleteしてbuildを通す
- 既存migrationを破壊的に書き換える
- `npm`、`yarn`、複数lockfileを混在させる
- 無断でpackage、framework、directory構成、API契約を変更する
- 「将来使うかもしれない」codeやtableを先回りして作る
- 指示なしにcommit、push、deploy、外部サービス設定変更を行う
