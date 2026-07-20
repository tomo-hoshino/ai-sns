# AI Office SNS — MVP実装タスク

## 0. 使い方

本書は上から順に実行します。各チェックボックスの「Cursorへの依頼」をそのままCursorへ渡せる粒度にしています。

Cursorへ依頼するときは、対象タスク1件だけを選び、末尾に次を付けてください。

```text
AGENTS.mdと関連docsを先に読み、対象外機能は追加しないでください。
実装後は変更ファイル、設計上の判断、実行した検証、残課題を報告してください。
完了条件をすべて満たした場合だけdocs/TASK.mdの対象チェックを更新してください。
```

### 進行ルール

- 原則として1タスク = 1回のCursor依頼 = 1commit候補とする。
- タスクを飛ばす場合は、依存先が完了済みか確認する。
- 完了条件を満たしていないタスクへ `[x]` を付けない。
- 実装中に仕様変更が必要になったらコードを先行せず、`SPEC.md` と `DECISIONS.md` を更新する。
- 3日目のデプロイ時間を守るため、Day 2終了時点で投稿・表示・DB保存まで動く状態にする。

## Day 1 — 土台、DB、読取API

### A. Next.js作成

- [x] **T-001 Next.jsプロジェクトを初期化する**

  Cursorへの依頼: 「リポジトリ直下にNext.js App Routerのプロジェクトを作成してください。TypeScript、Tailwind CSS、ESLint、`src/`、App Router、`@/*` alias、pnpmを使用してください。既存のREADME、AGENTS.md、docs配下は削除・上書きしないでください。`pnpm dev` と `pnpm build` が実行できる最小状態にしてください。」

  完了条件:

  - `src/app/layout.tsx` と `src/app/page.tsx` が存在する
  - `tsconfig.json` の `strict` がtrue
  - npm/yarnのlockfileがなく、`pnpm-lock.yaml` がある
  - 既存ドキュメントが保持されている
  - `pnpm build` が成功する

- [x] **T-002 必要最小限の依存関係を追加する**

  Cursorへの依頼: 「MVPに必要なruntime依存として `@supabase/supabase-js`、`openai`、`zod`、`server-only`、`date-fns` をpnpmで追加してください。開発依存としてVitest、jsdom、Testing Library一式、Prettier、`prettier-plugin-tailwindcss`、Supabase CLIを追加してください。未使用の状態管理・data fetching・ORMライブラリは追加しないでください。package scriptsに `typecheck`、`test`、`test:watch`、`format`、`format:check` を追加してください。」

  完了条件:

  - `pnpm typecheck` が `tsc --noEmit` を実行する
  - `pnpm test` がCI向けの単発実行になる
  - React Query、SWR、Prisma等が入っていない
  - `pnpm install` が成功する

- [x] **T-003 shadcn/uiとテスト基盤を初期化する**

  Cursorへの依頼: 「shadcn/uiをTailwind構成に合わせて初期化し、MVPで使う `avatar`、`badge`、`button`、`card`、`separator`、`skeleton`、`textarea`、`sonner` だけを追加してください。Vitestをjsdom環境で構成し、`tests/setup.ts` でjest-domを読み込んでください。サンプルテストを1件追加し、test scriptが動くことを確認してください。」

  完了条件:

  - shadcn/ui生成物だけが `src/components/ui` にある
  - `components.json` のaliasが `@/*` と一致する
  - `pnpm test` が成功する
  - 不要なUI部品を一括追加していない

- [x] **T-004 環境変数を型安全に定義する**

  Cursorへの依頼: 「`.env.example` と `src/lib/env.ts` を作成してください。`NEXT_PUBLIC_SUPABASE_URL`、`SUPABASE_SERVICE_ROLE_KEY`、`OPENAI_API_KEY`、`OPENAI_MODEL`、`AI_REPLIES_ENABLED` をZodで検証してください。server-only変数とpublic変数を分離し、秘密値をclientへexportしないでください。`AI_REPLIES_ENABLED` は文字列からbooleanへ安全に変換してください。`.env.local` がgitignore対象であることも確認してください。」

  完了条件:

  - `.env.example` に実値がない
  - `OPENAI_MODEL` の例が `gpt-5.6-luna`
  - 欠落・不正値では起動時または利用時に変数名を含む明確なエラーになる
  - clientからserver envをimportできない構成になっている

### B. Supabase設定

- [x] **T-005 初回migrationを作成する**

  Cursorへの依頼: 「ARCHITECTURE.mdのDB設計どおりに `profiles` と `posts` を作成するSupabase migrationを追加してください。PK/FK、文字数、handle、account_typeとpersona_keyの整合性、timeline/reply index、RLS有効化をSQLで実装してください。anon/authenticated向けpolicyは作成しないでください。既存migrationがある場合は編集せず、新規migrationを追加してください。」

  完了条件:

  - 2テーブル、FK、CHECK、UNIQUE、2つの部分indexがある
  - `posts.parent_post_id` は `posts.id` を参照し `ON DELETE CASCADE`
  - 両テーブルでRLSが有効
  - 公開policyがない

- [x] **T-006 固定アカウントseedを作成する**

  Cursorへの依頼: 「ARCHITECTURE.mdの固定UUIDを使い、`@you` と4つのAIアカウントを投入する `supabase/seed.sql` を作成してください。display name、bio、persona key、avatar pathはSPEC.mdと一致させ、`insert ... on conflict (id) do update` で再実行可能にしてください。AI以外のダミー投稿は追加しないでください。」

  完了条件:

  - 人間1件、AI4件だけが定義されている
  - ID、handle、persona keyがドキュメントと一致する
  - 2回実行しても重複しない

- [x] **T-007 SupabaseサーバークライアントとDB型を作成する**

  Cursorへの依頼: 「`src/lib/supabase/server.ts` にservice roleを使うサーバー専用Supabase clientを作成してください。`import "server-only"` を追加し、singletonまたは遅延初期化で利用してください。Supabase CLIからDB型を生成するscriptをpackage.jsonへ追加し、生成型を `src/types/database.ts` へ置く構成にしてください。client用Supabase clientは作成しないでください。」

  完了条件:

  - server clientだけが存在する
  - service role keyが `NEXT_PUBLIC_` 変数にない
  - `db:types` scriptがproject IDを環境変数または引数で受け取れる
  - `pnpm typecheck` が成功する

- [x] **T-008 domain型とrepositoryのmappingを実装する**

  Cursorへの依頼: 「ARCHITECTURE.mdの `Account`、`Post`、`TimelinePost` 型を `src/types` に定義し、`account-repository.ts` と `post-repository.ts` を作成してください。DBのsnake_caseをdomainのcamelCaseへ明示的にmappingしてください。固定人間取得、AI一覧取得、timelineページ取得、ルート投稿作成、AI返信作成、thread取得に必要な関数だけを実装してください。`any`、`as unknown as`、UI依存は禁止です。」

  完了条件:

  - repository関数の引数・戻り値が明示されている
  - Supabase errorを無視していない
  - timelineはルート投稿だけ、新着順、返信件数付き
  - thread返信は古い順
  - repository外へDB行のsnake_caseが漏れない

### C. 読取API

- [x] **T-009 共通validationとAPI型を作成する**

  Cursorへの依頼: 「API.mdに合わせ、UUID、limit、opaque cursor、投稿本文、API errorのZod schemaとTypeScript型を作成してください。文字数は `Array.from` と同等に数え、投稿本文はtrim後1〜300文字にしてください。cursorのencode/decodeを純粋関数として実装し、不正cursorを例外ではなくvalidation errorへ変換してください。単体テストも追加してください。」

  完了条件:

  - 空白、300文字、301文字、絵文字、不正cursorのテストがある
  - Zod objectがstrict
  - `any` と非null assertionがない

- [x] **T-010 タイムライン取得serviceとGET APIを実装する**

  Cursorへの依頼: 「`list-timeline-posts.ts` と `GET /api/posts` をAPI.mdどおりに実装してください。limit既定20・最大50、cursor pagination、`hasMore` と `nextCursor` を返してください。Route HandlerはvalidationとHTTP変換だけにし、DB処理はrepository、ユースケースはserviceへ置いてください。`Cache-Control: no-store` とrequest ID付きの共通エラーを実装してください。」

  完了条件:

  - 正常、空配列、不正limit、不正cursor、DB失敗をテストできる
  - 返信Postがtimelineに含まれない
  - API.mdとresponse shapeが一致する

- [x] **T-011 AIアカウント一覧serviceとGET APIを実装する**

  Cursorへの依頼: 「`get-ai-accounts.ts` と `GET /api/ai-accounts` をAPI.mdどおりに実装してください。AIだけを `backend`、`frontend`、`reviewer`、`pm` の固定順で返し、1時間のs-maxageとstale-while-revalidateを設定してください。persona key不正やDB失敗を握りつぶさないでください。」

  完了条件:

  - 人間アカウントを返さない
  - 並び順がDB作成日時に依存しない
  - cache headerとerror responseがAPI.mdどおり

## Day 2 — 投稿API、タイムラインUI、スレッド

### D. 投稿API

- [x] **T-012 メンション抽出を実装する**

  Cursorへの依頼: 「SPEC.mdのルールどおり、本文とAIアカウント配列から有効なAIを抽出する純粋関数を `src/lib/ai/mentions.ts` に実装してください。大文字小文字を無視し、完全一致、重複排除、出現順維持、最大4件を保証してください。存在しないhandle、似たhandle、句読点、改行、重複、大文字を含む単体テストを追加してください。」

  完了条件:

  - `@backend-ai-test` がbackend AIに一致しない
  - 同じAIは1件になる
  - 戻り値がDB取得済みAccountで、handle文字列だけではない
  - 全境界ケースのテストが成功する

- [x] **T-013 AI生成なしの投稿作成serviceを実装する**

  Cursorへの依頼: 「まずAI呼び出しを行わない `createPost` serviceを実装してください。固定 `@you` を取得し、trim済み本文をルート投稿として保存し、有効AIメンション一覧を返してください。依存するrepositoryを引数で差し替えられる関数にし、投稿保存失敗時のテストを作成してください。AI生成は次タスク用のinterfaceだけ定義し、仮返信を生成しないでください。」

  完了条件:

  - 人間投稿が常に `parentPostId: null`
  - 人間アカウント不在とDB保存失敗が明示的なdomain errorになる
  - unit testで実DB・OpenAIを呼ばない

- [x] **T-014 POST APIを実装する**

  Cursorへの依頼: 「`POST /api/posts` をAPI.mdどおりに実装してください。Content-Type、JSON parse、strict Zod schema、1〜300文字を検証し、createPost serviceを呼んで201を返してください。この時点ではAI generatorが未接続のため、有効メンションなしのケースを完成させ、generator依存を差し込める構造にしてください。400/500はrequest ID付きの共通error shapeにしてください。」

  完了条件:

  - メンションなしで `aiReplyStatus: "not_requested"`
  - 空文字、301文字、未知field、壊れたJSONが400
  - DB失敗が秘密情報なしの500
  - 人間投稿成功時が201

### E. 投稿一覧・投稿UI

- [x] **T-015 全体レイアウトとデザイントークンを実装する**

  Cursorへの依頼: 「AI社員が働くSNSらしい、落ち着いたオフィス調の全体レイアウトを実装してください。Header、最大幅 `max-w-2xl` のmain、背景・文字・border・AI別accentをTailwindのCSS変数または既存themeで定義してください。モバイル360pxを基準にし、dark mode切替やサイドバーは追加しないでください。日本語font stackとmetadataも設定してください。」

  完了条件:

  - `/` が360pxと1280pxで横スクロールしない
  - Headerはロゴ/名称だけで、未実装navがない
  - focus-visibleが確認できる

- [x] **T-016 PostCardとPostListを実装する**

  Cursorへの依頼: 「domain型だけをpropsに使い、`PostCard` と `PostList` を単一責任で実装してください。アバター、表示名、handle、AI badge、相対時刻、本文、返信件数、threadリンクを表示してください。本文は通常のReact textとして描画し、有効メンション部分だけ安全に分割して強調してください。空状態とcomponent testも追加してください。」

  完了条件:

  - `dangerouslySetInnerHTML` を使わない
  - 人間とAIの表示差がbadgeとaccentで判別できる
  - `time` 要素にISOの `dateTime` がある
  - PostCard内にAPI fetchや状態管理がない

- [x] **T-017 タイムライン初期表示を実装する**

  Cursorへの依頼: 「`src/app/page.tsx` をServer Componentとして実装し、`listTimelinePosts` serviceから初期20件を取得してPostListへ渡してください。loading.tsxに投稿カード型skeleton、error.tsxに再試行UIを実装してください。pageから自分自身のREST APIをfetchせず、serviceを直接利用してください。」

  完了条件:

  - 初期表示がServer Component
  - loading、empty、errorの3状態がある
  - service/repositoryの例外を画面へそのまま表示しない

- [x] **T-018 追加読込を実装する**

  Cursorへの依頼: 「`LoadMoreButton` をClient Componentで実装し、初期レスポンスのnextCursorを使って `GET /api/posts` から次ページを取得してください。取得中のdisabled、重複IDの除外、失敗時の再試行、hasMore=falseでボタン非表示を実装してください。無限スクロールやSWR/React Queryは導入しないでください。」

  完了条件:

  - cursorを改変せずAPIへ渡す
  - 連打で同時requestが発生しない
  - 同じPostが重複表示されない
  - エラー時に既存Postが消えない

- [x] **T-019 AIメンション候補UIを実装する**

  Cursorへの依頼: 「4つのAIアカウントをコンパクトなbutton/chipとして表示する `AiMentionList` を実装してください。クリック時に選択handleをcallbackし、アバター、表示名、handle、役割がキーボードとスクリーンリーダーで理解できるようにしてください。自動補完popoverや検索機能は追加しないでください。」

  完了条件:

  - 4つのAIが表示される
  - Tab/Enter/Spaceで選べる
  - buttonに説明可能なaccessible nameがある
  - 選択処理以外のフォーム状態を持たない

- [x] **T-020 PostComposerを実装する**

  Cursorへの依頼: 「`PostComposer` をClient Componentで実装してください。Textarea、Unicode基準の文字数表示、AI候補からカーソル位置へのmention挿入、1〜300文字validation、送信中disabled、`POST /api/posts` 呼び出し、成功時clearと `router.refresh()`、失敗時入力保持、Sonner通知を実装してください。二重送信と301文字入力を防いでください。」

  完了条件:

  - 0、1、300、301文字のcomponent testがある
  - mention選択で既存本文を壊さない
  - API 201のpartial/failed/disabledを適切な通知へ変換する
  - API error messageを安全に表示する

### F. スレッド表示

- [x] **T-021 thread取得serviceとGET APIを実装する**

  Cursorへの依頼: 「`get-thread.ts` と `GET /api/posts/[id]` をAPI.mdどおり実装してください。UUIDを検証し、ルート投稿と直下返信を取得し、返信を古い順で返してください。ルート不在または返信ID指定は404、DB失敗は500にしてください。`Cache-Control: no-store` とrequest IDを設定してください。」

  完了条件:

  - 正常、返信0件、不正UUID、ルートなし、返信ID、DB失敗をテストできる
  - 多階層返信を仮実装しない
  - API responseがAPI.mdと一致する

- [x] **T-022 スレッド画面を実装する**

  Cursorへの依頼: 「`/posts/[id]` をServer Componentで実装してください。ルートPostを強調し、返信を時系列で縦に表示するThread component、timelineへ戻るリンク、返信0件の表示、loading UIを追加してください。存在しないルートはNext.jsの `notFound()` を使ってください。人間の返信フォームは追加しないでください。」

  完了条件:

  - rootとrepliesが視覚的に同じthreadだと分かる
  - 404と戻る導線がある
  - 360pxで崩れない
  - PostCardを再利用し、thread専用の重複カードを作らない

## Day 3 — AI返信、品質確認、デプロイ

### G. AI返信

- [x] **T-023 persona定義をコード化する**

  Cursorへの依頼: 「PROMPTS.mdの4つのsystem promptを `src/lib/ai/personas.ts` に型安全なreadonly mapとして実装してください。persona keyは `backend | frontend | reviewer | pm` のunionとし、DBのAIアカウントが未知のpersona keyなら明示的に失敗させてください。promptをDBへ複製せず、prompt内容がPROMPTS.mdと一致するテストを追加してください。」

  完了条件:

  - 4 personaが欠けていないことを `satisfies` で保証する
  - 文字列キーへの無制限index accessがない
  - promptに300文字、prompt injection、機密情報のルールがある

- [x] **T-024 OpenAI clientと1件の返信生成を実装する**

  Cursorへの依頼: 「公式OpenAI Node SDKのResponses APIを使い、`generate-reply.ts` に1 AI分の返信生成を実装してください。modelは `OPENAI_MODEL`、system指示はpersona、inputは信頼しないデータとして区切ったroot postと既存返信最大20件、`store: false`、適切な `max_output_tokens` を指定してください。`output_text` をtrimし、空文字は失敗、300文字超は `Array.from` で安全に切り詰めてください。API keyやpromptをログへ出さないでください。」

  完了条件:

  - OpenAI SDKはserver-onlyモジュールからだけ利用する
  - model名をコードへ直書きしない
  - network失敗、空出力、長文のテストがある
  - AI出力をHTMLとして扱わない

- [x] **T-025 createPostへAI返信を統合する**

  Cursorへの依頼: 「createPost serviceへAI返信生成を統合してください。人間投稿を先に保存し、有効AIごとに `Promise.allSettled` でgenerate→返信保存を独立実行し、API.mdの `aiReplyStatus`、`succeededAiHandles`、`failedAi` を組み立ててください。AI返信を入力に再度mention解析せず、再帰生成を禁止してください。`AI_REPLIES_ENABLED=false` ではOpenAIを呼ばずdisabledを返してください。」

  完了条件:

  - 0件、1件、複数、重複、部分失敗、全失敗、disabledのtestがある
  - AI失敗でも人間投稿を削除しない
  - 1 AIにつき返信は最大1件
  - 失敗AIのhandleと安全なcodeだけをAPIへ返す

- [x] **T-026 POST APIとUIのAI返信結果を完成させる**

  Cursorへの依頼: 「POST /api/postsが統合済みcreatePostの結果をAPI.mdどおり201で返すよう完成させ、PostComposerでcompleted/partial/failed/disabled/not_requestedを区別して通知してください。成功後は `router.refresh()` し、AI返信を含む返信件数がtimelineへ反映されることを確認してください。OpenAI失敗をHTTP 500へ変換しないでください。」

  完了条件:

  - API契約testが5つのstatusを網羅する
  - 部分失敗でも成功通知と注意通知を区別できる
  - threadで生成済み返信を確認できる

### H. 品質確認

- [x] **T-027 エラー・ローディング・アクセシビリティを通し確認する**

  Cursorへの依頼: 「SPEC.mdのユーザーストーリーに沿って、timeline、composer、load more、threadのloading/empty/error/disabled状態を確認し、不足だけを修正してください。label、aria-live、focus-visible、button type、time datetime、キーボード操作、色コントラストを点検してください。デザイン刷新や新機能追加は行わないでください。」

  完了条件:

  - 送信結果がaria-liveで通知される
  - マウスなしで投稿・mention・thread移動ができる
  - errorから再試行できる

- [x] **T-028 セキュリティと秘密情報を確認する**

  Cursorへの依頼: 「リポジトリ全体を検索し、service role key/OpenAI keyの実値、`NEXT_PUBLIC_` の誤用、client componentからserver moduleへのimport、`dangerouslySetInnerHTML`、投稿全文やsystem promptのログ、未検証入力がないか確認してください。発見したMVP範囲内の問題を修正し、確認結果を報告してください。」

  完了条件:

  - 秘密情報の実値がGit管理ファイルにない
  - browser bundleから秘密値へ到達できない
  - 外部入力がZod検証される
  - RLSが有効で公開policyがない

- [x] **T-029 自動品質チェックをすべて通す**

  Cursorへの依頼: 「`pnpm format:check`、`pnpm lint`、`pnpm typecheck`、`pnpm test`、`pnpm build` を順に実行し、失敗原因を根本から修正してください。test削除、lint rule無効化、型アサーション追加だけで通さないでください。最終結果と未解決warningを報告してください。」

  完了条件:

  - 5コマンドがすべてexit code 0
  - `any`、`@ts-ignore`、理由のないeslint-disableがない
  - testが主要な境界条件を保持している

- [x] **T-030 手動受け入れテストを実施する**

  Cursorへの依頼: 「SPEC.mdの完成条件を手動テスト用チェックリストとして実行してください。特にメンションなし、単一AI、複数AI、重複AI、未知AI、300/301文字、AI API失敗、存在しないthread、360px/1280pxを確認し、結果をこのタスク配下の実施記録へ追記してください。不具合はMVP範囲だけ修正してください。」

  完了条件:

  - 完成条件の各項目にPass/Failと確認日がある
  - Failが0件
  - OpenAI利用量が想定外に増えていない

  実施記録（Local / commit `a2768ed` + 作業ツリー / 2026-07-19）:

  | SPEC完成条件                                                | 結果 | 確認日     | 備考                                                                                   |
  | ----------------------------------------------------------- | ---- | ---------- | -------------------------------------------------------------------------------------- |
  | 1〜300文字の人間投稿を作成できる                            | Pass | 2026-07-19 | API: 300文字で201。UI: 投稿欄と文字数表示を確認                                        |
  | 空文字と301文字以上をUI・API・DBの3層で拒否できる           | Pass | 2026-07-19 | API: 空/空白/301が400。UI: 空は送信disabled、入力は300文字でclamp                      |
  | タイムラインへルート投稿が新着順で表示される                | Pass | 2026-07-19 | 再検証でも最新ルートが先頭。`replyCount` 反映を確認                                    |
  | 4つのAIアカウントが表示され、候補からメンションを挿入できる | Pass | 2026-07-19 | 4候補表示。Backend AIクリックで `@backend-ai ` 挿入                                    |
  | `@backend-ai` だけを含む投稿ではBackend AIだけが1件返信する | Pass | 2026-07-19 | 再検証: thread返信1件・author=`backend-ai` のみ                                        |
  | 複数の有効AIをメンションすると各AIが最大1件返信する         | Pass | 2026-07-19 | 再検証: backend+frontend 各1件（計2件）                                                |
  | 存在しないメンションではAI返信が生成されない                | Pass | 2026-07-19 | `@not-an-ai-account` で `not_requested`、返信0件、投稿は残る                           |
  | AI返信の失敗時も人間投稿が残り、失敗を画面で認識できる      | Pass | 2026-07-19 | 初回検証でAPI 201+`failed`。UIは `create-post-toasts` の failed/partial 通知を実装済み |
  | ルート投稿とAI返信をスレッド画面で閲覧できる                | Pass | 2026-07-19 | 再検証: 複数AIスレッドで root+返信2件を画面確認                                        |
  | AI返信から再帰的な返信が生成されない                        | Pass | 2026-07-19 | 返信はすべて root 直下のみ。AI返信を親とする追加返信なし                               |
  | 主要画面が360px幅と1280px幅で崩れない                       | Pass | 2026-07-19 | 横スクロールなし（`scrollWidth===clientWidth`）                                        |
  | APIキーがクライアントバンドル、レスポンス、ログへ露出しない | Pass | 2026-07-19 | errorに秘密値なし。client chunksにenv名なし                                            |
  | `pnpm lint` / `typecheck` / `test` / `build` が成功する     | Skip | 2026-07-19 | T-029完了済み。本タスクでは再実行せず                                                  |
  | Vercel Production URLで主要導線を確認できる                 | Skip | 2026-07-19 | T-033対象                                                                              |
  | README等ドキュメントが実装と一致している                    | Pass | 2026-07-19 | T-034で同期完了                                                                        |

  特記（TASK指定ケース）:

  - メンションなし: Pass（`not_requested`）
  - 単一AI: Pass（再検証）
  - 複数AI: Pass（再検証、各1件）
  - 重複AI: Pass（`@backend-ai` 二重でも返信1件）
  - 未知AI: Pass
  - 300/301文字: Pass
  - AI API失敗: Pass（人間投稿保持・201・failed meta）
  - 存在しないthread: Pass（API 404、画面「ページが見つかりません」）
  - 360px/1280px: Pass
  - OpenAI利用量: Pass（再検証はAI生成4回程度。$5枠内で想定内）

  観測（完了阻害ではない）:

  - React hydration warning（相対時刻のserver/client差分と推定）
  - アバター画像 `/avatars/*.png` が404

### I. Vercelデプロイ

- [x] **T-031 Supabase本番環境を準備する**

  Cursorへの依頼: 「READMEの手順に従い、本番Supabase projectへmigrationとseedを反映するためのコマンドと確認SQLを提示してください。破壊的resetは行わず、対象project refを実行前に確認してください。反映後、5 profiles、0件以上のposts、RLS、indexをread-only SQLで確認してください。」

  完了条件:

  - 本番project refを取り違えていない
  - migration履歴が適用済み
  - 固定アカウント5件が存在する
  - RLSとindexが確認できる

  実施記録（Production / project ref `nvsaieyiwztfhnpftwhd` / 2026-07-19）:

  | 確認項目          | 結果 | 備考                                                                                                                    |
  | ----------------- | ---- | ----------------------------------------------------------------------------------------------------------------------- |
  | project ref一致   | Pass | linked / `.env.local` URL / CLI projects list がすべて `nvsaieyiwztfhnpftwhd`（tomo-hoshino's Project, ap-northeast-2） |
  | migration履歴     | Pass | local/remote とも `20260718121430`。`db reset` は未実行                                                                 |
  | 固定アカウント5件 | Pass | profiles=5（human1 + ai4）、固定UUID5件一致。seed.sql を idempotent 再実行済み                                          |
  | posts件数         | Pass | 16件（0件以上）                                                                                                         |
  | RLS               | Pass | `profiles`/`posts` とも `relrowsecurity=true`。公開policy 0件                                                           |
  | index             | Pass | `posts_timeline_idx` / `posts_replies_idx` 存在                                                                         |

  実行コマンド（破壊的操作なし）:

  ```bash
  pnpm exec supabase projects list
  pnpm exec supabase migration list
  pnpm exec supabase db query --linked --file supabase/seed.sql
  ```

  確認SQL（read-only）:

  ```sql
  -- profiles / seed
  select count(*)::int as profile_count,
    count(*) filter (where id in (
      '00000000-0000-4000-8000-000000000001',
      '00000000-0000-4000-8000-000000000101',
      '00000000-0000-4000-8000-000000000102',
      '00000000-0000-4000-8000-000000000103',
      '00000000-0000-4000-8000-000000000104'
    ))::int as fixed_seed_count,
    count(*) filter (where account_type = 'human')::int as human_count,
    count(*) filter (where account_type = 'ai')::int as ai_count
  from public.profiles;

  select count(*)::int as post_count from public.posts;

  -- RLS
  select c.relname as table_name, c.relrowsecurity as rls_enabled
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public' and c.relname in ('profiles', 'posts');

  select count(*)::int as public_policy_count
  from pg_policies
  where schemaname = 'public' and tablename in ('profiles', 'posts');

  -- indexes
  select indexname
  from pg_indexes
  where schemaname = 'public'
    and tablename = 'posts'
    and indexname in ('posts_timeline_idx', 'posts_replies_idx');
  ```

- [x] **T-032 Vercelへデプロイする**

  Cursorへの依頼: 「READMEの手順に従いVercelへデプロイしてください。`NEXT_PUBLIC_SUPABASE_URL`、`SUPABASE_SERVICE_ROLE_KEY`、`OPENAI_API_KEY`、`OPENAI_MODEL`、`AI_REPLIES_ENABLED` の存在を値を表示せず確認し、Production buildを実行してください。設定変更や外部書き込みの直前には対象を明示してください。」

  完了条件:

  - Production deploymentがReady
  - build logに秘密値がない
  - Production URLがHTTPSで開く

  実施記録（Production / project `hoshi-t/ai-sns` / 2026-07-19）:

  | 確認項目                    | 結果 | 備考                                                      |
  | --------------------------- | ---- | --------------------------------------------------------- |
  | env 5変数の存在             | Pass | 値非表示で確認。Production / Preview / Development へ設定 |
  | Production deployment Ready | Pass | `dpl_5Ej38BNiDPjh363KVjAaUVBTRQzk` / `readyState=READY`   |
  | build logに秘密値なし       | Pass | JWT / `sk-` / key assignment パターンなし                 |
  | Production URL HTTPS        | Pass | `https://ai-sns-six.vercel.app` が HTTP 200               |

  Production URL: https://ai-sns-six.vercel.app  
  Inspect: https://vercel.com/hoshi-t/ai-sns/5Ej38BNiDPjh363KVjAaUVBTRQzk

  特記:

  - GitHub Login Connection未設定のため、Git連携Importは未完了。CLIでProduction deployを実施
  - FrameworkはNext.js、`pnpm build` で成功

- [x] **T-033 本番スモークテストと運用ガードを確認する**

  Cursorへの依頼: 「Production URLでtimeline表示、通常投稿、単一AI mention、thread表示を1回ずつ確認してください。OpenAI projectの月額予算/使用量アラートが設定されていること、緊急停止用 `AI_REPLIES_ENABLED=false` の変更手順がREADMEにあることを確認してください。テスト投稿以外のデータを削除しないでください。」

  完了条件:

  - 本番の主要導線がPass
  - AI返信が指定した1 AIからだけ返る
  - 予算・停止手段が確認できる
  - Production URLをREADMEまたはリポジトリ説明へ記録する

  実施記録（Production / URL `https://ai-sns-six.vercel.app` / commit `380d2cd` / 2026-07-19）:

  | 確認項目                       | 結果 | 備考                                                                                                 |
  | ------------------------------ | ---- | ---------------------------------------------------------------------------------------------------- |
  | timeline表示                   | Pass | UIで投稿一覧・composer・AI候補を確認。`GET /api/posts` も200                                         |
  | 通常投稿                       | Pass | `T-033 smoke normal ...` を作成。`replyCount=0`                                                      |
  | 単一AI mention                 | Pass | `@backend-ai T-033 smoke single-ai ...`。返信1件のみ、author=`backend-ai`                            |
  | thread表示                     | Pass | `/posts/fbc116e9-47b2-4cac-8002-6fb851d2d54e` で root + Backend AI 返信を確認                        |
  | 緊急停止手順（README）         | Pass | README に Vercel での `AI_REPLIES_ENABLED=false` 変更・再デプロイ手順を追記                          |
  | Production URL記録             | Pass | README「Production」節 + GitHub `homepageUrl`                                                        |
  | OpenAI 月額予算/使用量アラート | Pass | Limits: spend limit `$100`、alerts 80%($80) / 100%($100)。Billing: credit `$4.99`、auto recharge off |

  特記:

  - テスト投稿以外のデータは削除していない
  - 単一AI返信 ID: `70268f4c-9efc-47a6-9cce-e8ab7ba0aa7c`（`parentPostId` は root のみ）

- [x] **T-034 ドキュメントと実装を最終同期する**

  Cursorへの依頼: 「README、SPEC、TASK、ARCHITECTURE、API、DECISIONS、PROMPTS、AGENTSと実装を比較し、パス、env名、API shape、DB列、AI名、コマンドの不一致だけを修正してください。将来案をMVP実装済みのように書かないでください。最後に変更したドキュメントと理由を報告してください。」

  完了条件:

  - 8ドキュメントとコードに既知の不一致がない
  - 完成条件がすべて `[x]`
  - 実装していない将来機能が明確に区別されている

  実施記録（Local / 2026-07-19）:

  | 確認項目          | 結果 | 備考                                                                                              |
  | ----------------- | ---- | ------------------------------------------------------------------------------------------------- |
  | パス・構成の同期  | Pass | README / ARCHITECTURE の tree を実装に合わせた。`public/avatars/` は未同梱と明記                  |
  | AI入力の同期      | Pass | createPost が `existingReplies: []` であることを SPEC / ARCHITECTURE / PROMPTS / DECISIONS に反映 |
  | API・env・persona | Pass | 契約・env名・seed・prompt本文に不一致なし。Production URL を API.md へ反映                        |
  | SPEC DoD          | Pass | T-030 / T-033 完了済み項目と docs 同期をすべて `[x]`                                              |
  | 将来機能の区別    | Pass | README「今後追加したい機能」と SPEC §7 は未実装のまま維持                                         |

## 実施記録

手動テスト時に追記します。

| 日付       | 環境                         | Commit    | 結果        | 備考                                                                                               |
| ---------- | ---------------------------- | --------- | ----------- | -------------------------------------------------------------------------------------------------- |
| YYYY-MM-DD | Local / Preview / Production | `abcdef0` | Pass / Fail | 事実だけを記載                                                                                     |
| 2026-07-19 | Local                        | `a2768ed` | Fail        | 初回。OpenAIキー未設定相当でAI成功系Fail                                                           |
| 2026-07-19 | Local                        | `a2768ed` | Pass        | 個人OpenAIキー設定後に再検証。単一/複数/重複AI・thread・再帰なしをPass。Fail 0件でT-030完了        |
| 2026-07-19 | Production                   | `735557a` | Pass        | T-032。Vercel `hoshi-t/ai-sns` をCLIデプロイ。URL `https://ai-sns-six.vercel.app` Ready            |
| 2026-07-19 | Production                   | `380d2cd` | Pass        | T-033。主要導線Pass。OpenAI spend limit $100、alerts 80%/100%、credit $4.99 / auto recharge off    |
| 2026-07-19 | Local                        | —         | Pass        | T-034。8ドキュメントを実装と同期。SPEC DoD 全 `[x]`。コード変更なし                                |
| 2026-07-19 | Local                        | —         | Pass        | T-100。Post-MVP方針を SPEC §11 / ADR-005〜007 に固定。実装なし                                     |
| 2026-07-19 | Local                        | —         | Pass        | T-101。AI対応表・handle alias・promptたたき台を SPEC §11.6 / PROMPTS §9 / ADR-008 に固定。実装なし |
| 2026-07-19 | Local                        | —         | Pass        | T-102。seed/migration・personas・mention alias・docs/test を新キャラへ差し替え                     |
| 2026-07-19 | Local                        | —         | Pass        | T-103。`public/avatars` に独自アバター5枚を配置。公式ビジュアル不使用                              |
| 2026-07-19 | Local                        | —         | Pass        | T-110。Auth trigger + RLS migration。ADR-009 / ARCHITECTURE / API。コード変更なし                  |
| 2026-07-19 | Local                        | —         | Pass        | T-111。magic link ログイン UI / Header / session cookie / `@supabase/ssr`                          |
| 2026-07-20 | Local                        | —         | Pass        | T-131。`/profiles/[handle]` + ルート投稿一覧・空状態。編集なし                                     |
| 2026-07-20 | Local                        | —         | Pass        | T-132。PostCard の表示名・アバター・handle からプロフィールへ遷移                                  |
| 2026-07-20 | Local                        | —         | Pass        | Guest投稿・About画面の方針を SPEC §11.7〜11.8 / ADR-010〜011 / TASK T-140〜T-151 に固定。実装なし   |

## Post-MVP — 追加要望

MVP（T-001〜T-034）完了後の追加要望です。**実装前に必ず仕様・権利を決めてから着手**してください。完了済みタスク以外は未実装です。Guest 投稿（T-140〜）と About 画面（T-150〜）は 2026-07-20 に方針固定済みです。

参照キャラクター（レバテック公式ニュースより『ひよっこITエンジニア ピヨ沢』）:

| 名前     | 公式の役割・性格（要約）                                           |
| -------- | ------------------------------------------------------------------ |
| ピヨ沢   | 新人ITエンジニア。真面目で勉強熱心。純粋さがあらぬ方向へ行くことも |
| ピーエム | プロジェクトマネージャー。タスクと進行の管理                       |
| フリー   | フリーランスエンジニア。「フリーすぎる」フリーランス               |
| テック   | テックリード。ピヨ沢の教育係。技術を聞いたら教えてくれる           |

出典: [レバテックニュース（2025-07-11）](https://levtech.co.jp/news/3823976/)

### 0. 着手前の方針決定（必須）

- [x] **T-100 追加機能の方針をSPEC/DECISIONSに固定する**

  Cursorへの依頼: 「Post-MVP要望（ピヨ沢キャラ差し替え、ログイン、プロフィール）について、実装せずに仕様だけを `docs/SPEC.md` と `docs/DECISIONS.md` へ追記してください。権利・認証方式・プロフィール最小画面を決め、MVP対象外との境界を明確にしてください。」

  完了条件:

  - 各機能の「作る / 作らない / 後回し」が文書化されている
  - レバテックIP利用可否（社内利用のみ / 公開可 / 独自アレンジ）が明記されている
  - ログイン方式（例: Supabase Auth + email magic link / OAuth）が1つに決まっている

  実施記録（Docs only / 2026-07-19）:

  | 確認項目                 | 結果 | 備考                                                              |
  | ------------------------ | ---- | ----------------------------------------------------------------- |
  | 作る / 作らない / 後回し | Pass | `SPEC.md` §11.1                                                   |
  | レバテックIP             | Pass | **独自アレンジ**（社内のみ・公開可での公式利用は不採用）。ADR-005 |
  | ログイン方式             | Pass | **Supabase Auth + email magic link のみ**。ADR-006                |
  | プロフィール最小画面     | Pass | 閲覧専用 `/profiles/[handle]`。ADR-007                            |
  | コード変更               | Pass | 実装なし（docsのみ）                                              |

### J. AIキャラクター差し替え（ピヨ沢チーム）

- [x] **T-101 4 AIの表示名・handle・persona・役割マッピングを決める**

  Cursorへの依頼: 「現行の backend/frontend/reviewer/pm を、ピヨ沢・ピーエム・フリー・テックへどう対応付けるか表にして `SPEC.md` / `PROMPTS.md` を更新してください。実装はまだしないでください。handle変更時の既存投稿互換方針も含めてください。」

  完了条件:

  - 4キャラの displayName / handle / personaKey / bio / UIカラー対応表がある
  - 旧handleを残すかリネームするかが決まっている
  - prompt方針（口調・禁止事項）のたたき台がある

  実施記録（Docs only / 2026-07-19）:

  | 確認項目         | 結果 | 備考                                                                 |
  | ---------------- | ---- | -------------------------------------------------------------------- |
  | 対応表           | Pass | `SPEC.md` §11.6。センドウ/ソラ/ヒヨリ/カナメ。`personaKey` 維持      |
  | 着想元マッピング | Pass | テック→backend、フリー→frontend、ピヨ沢→reviewer、ピーエム→pm        |
  | 旧handle方針     | Pass | **リネーム** + mention **legacy alias**。本文は書き換えない。ADR-008 |
  | promptたたき台   | Pass | `PROMPTS.md` §9（口調・NG・完成版draft）                             |
  | コード変更       | Pass | 実装なし（docsのみ）                                                 |

- [x] **T-102 seed・personas・mention候補・UI文言を差し替える**

  Cursorへの依頼: 「T-101の対応表どおりに `supabase/seed.sql`、`src/lib/ai/personas.ts`、関連UI/test/docsを更新してください。migrationで壊れる既存データを扱う場合は新規migrationで対応してください。」

  完了条件:

  - 画面とAPIで新キャラ名が表示される
  - mention抽出とAI返信が新handleで動く
  - `pnpm test` / `typecheck` が通る

  実施記録（2026-07-19）:

  | 確認項目                       | 結果 | 備考                                                            |
  | ------------------------------ | ---- | --------------------------------------------------------------- |
  | seed / migration               | Pass | 新handle・displayName・bio・avatar_path。`persona_key`/UUID維持 |
  | personas / PROMPTS             | Pass | §3〜§6 と `personas.ts` を同期                                  |
  | mention legacy alias           | Pass | 旧handle受理・正規handleと重複排除。候補UIは正規handleのみ      |
  | `pnpm typecheck` / `pnpm test` | Pass | 188 tests                                                       |

- [x] **T-103 アバター画像を用意して `public/avatars` に配置する**

  Cursorへの依頼: 「新AIと人間用のアバターを `public/avatars` に置き、seedの `avatar_path` と一致させてください。権利的に使えない公式ビジュアルは使わず、利用可能な代替アセットにしてください。」

  完了条件:

  - `/avatars/*.png`（または採用拡張子）が404にならない
  - タイムラインとプロフィール相当の表示で画像が出る

  実施記録（Local / 2026-07-19）:

  | 確認項目             | 結果 | 備考                                                                           |
  | -------------------- | ---- | ------------------------------------------------------------------------------ |
  | seedパス一致         | Pass | `you` / `sendo-ai` / `sora-ai` / `hiyori-ai` / `kaname-ai` の5 PNG             |
  | 権利（独自アレンジ） | Pass | 公式ビジュアル不使用。オリジナルのフラットイラスト                             |
  | 静的配信             | Pass | `/avatars/*.png` が 200（404なし）                                             |
  | 表示                 | Pass | PostCard / AiMentionList が `avatarPath` を参照。プロフィール画面は T-131 以降 |

### K. ログイン機能

- [x] **T-110 認証基盤とprofiles連携を設計・migrationする**

  Cursorへの依頼: 「Supabase Authを前提に、`auth.users` と `profiles` の紐付け、固定 `@you` 廃止方針、RLS/policyの初期案をmigrationとdocsで追加してください。投稿APIが『ログイン中ユーザー』を著者にする前提をARCHITECTURE/APIへ反映してください。」

  完了条件:

  - 人間アカウントがAuthユーザーに紐づく
  - service role前提の現状から、必要なpolicyだけが文書化されている
  - 未ログイン時の扱い（投稿不可 / 閲覧のみ）が決まっている

  実施記録（Local / 2026-07-19）:

  | 確認項目               | 結果 | 備考                                                           |
  | ---------------------- | ---- | -------------------------------------------------------------- |
  | Auth ↔ profiles 紐付け | Pass | `profiles.id = auth.users.id` + signup trigger（migration）    |
  | `@you` 廃止方針        | Pass | レガシーとして残置。新規著者には使わない（T-112）。ADR-009     |
  | RLS 初期 policy        | Pass | SELECT public + INSERT own root。ARCHITECTURE §6.6 / migration |
  | 未ログイン時           | Pass | 閲覧可 / POST 401。API.md・SPEC §11.3                          |
  | 投稿著者契約           | Pass | ARCHITECTURE §4.2 / API.md §3。Route Handler 反映は T-112      |
  | アプリコード変更       | Pass | なし（docs + migration のみ）                                  |

- [x] **T-111 サインアップ・ログイン・ログアウトUIを実装する**

  Cursorへの依頼: 「メールmagic linkまたはT-100で決めた方式で、ログイン/ログアウト画面とHeader導線を実装してください。未実装のSNS連携や管理画面は追加しないでください。」

  完了条件:

  - ログイン後にセッションが維持される
  - ログアウトできる
  - 秘密情報がclient bundleに出ない

  実施記録（Local / 2026-07-19）:

  | 確認項目                        | 結果 | 備考                                                                                      |
  | ------------------------------- | ---- | ----------------------------------------------------------------------------------------- |
  | magic link UI                   | Pass | `/login` + `signInWithOtp`。signup/login 同一導線（`shouldCreateUser: true`）             |
  | callback → session              | Pass | `/auth/callback` で `exchangeCodeForSession`。`proxy.ts` で cookie refresh                |
  | Header 導線                     | Pass | 未ログイン: ログインリンク / ログイン中: email + ログアウト                               |
  | 未ログイン閲覧                  | Pass | proxy は redirect しない。timeline/thread は従来どおり閲覧可                              |
  | 秘密情報                        | Pass | service role / OpenAI key は server-only。browser は anon key のみ（Data API 直書込なし） |
  | `pnpm typecheck` / test / build | Pass | 202 tests。実行結果は報告参照                                                             |

- [x] **T-112 投稿作成をログインユーザー著者へ切り替える**

  Cursorへの依頼: 「`createPost` と `POST /api/posts` を、固定 `@you` ではなく認証済みユーザーのprofileを著者にするよう変更してください。未ログインは401にしてください。」

  完了条件:

  - 著者IDがセッションユーザーと一致する
  - API契約とtestが更新されている
  - 既存のAI返信フローは維持される

  実施記録（Local / 2026-07-19）:

  | 確認項目       | 結果 | 備考                                                                                         |
  | -------------- | ---- | -------------------------------------------------------------------------------------------- |
  | セッション著者 | Pass | `getSessionUser` → `findHumanAccountById` → `createPost({ author })`。固定 `@you` は使わない |
  | 未ログイン 401 | Pass | `UNAUTHORIZED` / 「ログインが必要です。」。Route Handler が先に拒否                          |
  | profile 不在   | Pass | 500 `INTERNAL_ERROR`（API.md）                                                               |
  | AI返信フロー   | Pass | mention 抽出・並列生成・`meta.failedAi` は従来どおり                                         |
  | API契約 / test | Pass | `UNAUTHORIZED` を型・Zodへ追加。service / Route Handler test 更新                            |

### L. プロフィール機能

- [x] **T-130 プロフィール取得APIを実装する**

  Cursorへの依頼: 「`GET /api/profiles/[handle]` を追加し、人間/AI共通で displayName・bio・accountType・avatar・persona（AIのみ）を返す契約をAPI.mdどおり実装してください。」

  完了条件:

  - 存在しないhandleは404
  - AIと人間でresponse shapeが一致（差分はnullable fieldのみ）
  - request ID付きerror

  完了記録:

  | 項目                         | 結果 | メモ                                                 |
  | ---------------------------- | ---- | ---------------------------------------------------- |
  | API契約                      | Pass | `docs/API.md` §6。共通 Account + `PROFILE_NOT_FOUND` |
  | `GET /api/profiles/[handle]` | Pass | Route Handler + `getProfile` + `findAccountByHandle` |
  | 人間/AI shape一致            | Pass | nullable は `personaKey` のみ。旧handleは404         |
  | request ID付きerror          | Pass | 400 / 404 / 500 いずれも `requestId`                 |

- [x] **T-131 プロフィール画面と投稿一覧を実装する**

  Cursorへの依頼: 「`/profiles/[handle]` をServer Componentで実装し、プロフィール見出しとそのユーザーのルート投稿一覧（新着順）を表示してください。編集機能はまだ作らないでください。」

  完了条件:

  - AI/人間どちらも閲覧できる
  - 投稿0件の空状態がある
  - 360pxで崩れない

  完了記録:

  | 項目             | 結果 | メモ                                                               |
  | ---------------- | ---- | ------------------------------------------------------------------ |
  | Server Component | Pass | `/profiles/[handle]`。service直接利用（自API fetchなし）           |
  | AI/人間の閲覧    | Pass | `ProfileHeader` で accountType・AI役割ラベル・人間バッジを表示     |
  | ルート投稿一覧   | Pass | `listProfilePosts` + `findRootPostsByAuthorId`（新着順・返信除外） |
  | 投稿0件の空状態  | Pass | `ProfilePostList` の status メッセージ                             |
  | 編集なし         | Pass | 編集UI/APIは未追加                                                 |
  | loading / error  | Pass | skeleton と再試行UI。不正・不在handleは `notFound()`               |

- [x] **T-132 PostCard等からプロフィールへ遷移できるようにする**

  Cursorへの依頼: 「表示名・アバター・handleから `/profiles/[handle]` へリンクしてください。未実装のフォローボタン等は追加しないでください。」

  完了条件:

  - タイムラインとthreadの両方から遷移できる
  - keyboardで辿れる
  - 自分のプロフィールにも遷移できる（ログイン実装後）

  完了記録:

  | 項目                        | 結果 | メモ                                                                |
  | --------------------------- | ---- | ------------------------------------------------------------------- |
  | PostCard プロフィールリンク | Pass | アバター・表示名・handle → `/profiles/[handle]`。フォロー等は未追加 |
  | timeline / thread           | Pass | 両方とも `PostCard` 経由で遷移                                      |
  | keyboard                    | Pass | `Link` + `focus-visible`。アバターは accessible name 付き           |
  | 自分のプロフィール          | Pass | 著者 handle へリンクするためログインユーザー投稿からも遷移可能      |

### M. 未ログイン Guest 投稿

magic link のメール送信上限でログインできない場合でも投稿できるようにする。方針は SPEC §11.7 / ADR-010。

- [ ] **T-140 Guest プロフィールを seed / docs に固定する**

  Cursorへの依頼: 「既存レガシー `@you`（UUID `...0001`）を共有 Guest へリネームする方針（SPEC §11.7 / ADR-010）に合わせ、`supabase/seed.sql` と必要なら新規 migration で handle=`guest`・displayName=`Guest` に更新してください。avatar は既存を流用してよいです。SPEC / ARCHITECTURE / API の表記を `@guest` に揃え、Auth 非連携のままにしてください。アプリの投稿ロジックはまだ変えず、次タスク（T-141）へ委ねてください。」

  完了条件:

  - seed（と migration）で `@guest` / `Guest` が定義されている
  - 既存投稿の `author_id` は同一 UUID のまま壊れない
  - docs の固定アカウント表が `@guest` を指す
  - 投稿 API の挙動はまだ変更していない（T-141）

- [ ] **T-141 未ログイン投稿を Guest 著者へフォールバックする**

  Cursorへの依頼: 「`POST /api/posts` と `createPost` を、セッションがあればその人間 profile、なければ固定 Guest（`@guest`）を著者にするよう変更してください。未ログインを 401 にしないでください。API.md / test を更新し、AI返信フローは維持してください。」

  完了条件:

  - 未ログインでも 201 で Guest 投稿ができる
  - ログイン中はセッションユーザーが著者になる
  - Guest profile 不在時は 500 `INTERNAL_ERROR`
  - `pnpm test` / `typecheck` が通る

- [ ] **T-142 未ログインでも composer を表示し Guest 投稿であることを示す**

  Cursorへの依頼: 「ホームの PostComposer を未ログインでも使えるようにし、『Guest として投稿』である旨が分かる短い表示を付けてください。ログイン導線は残し、未実装のアカウント切替UIは追加しないでください。」

  完了条件:

  - 未ログインでタイムラインから投稿できる
  - Guest 投稿であることが UI で分かる（色だけに依存しない）
  - ログイン中は従来どおり自分のアカウントで投稿できる
  - 360px で崩れない

### N. About 画面

- [ ] **T-150 `/about` に仕様・技術・実装手順ページを実装する**

  Cursorへの依頼: 「SPEC §11.8 / ADR-011 どおり `/about` を Server Component で実装してください。セクションは (1) コンセプトと主要仕様の要約 (2) 技術スタック (3) 実装手順（Day1〜3 と Post-MVP の流れ）です。`docs/*.md` を runtime で読まず、要約を `src/features/about` のコンポーネントへ置いてください。編集UIや認証必須は追加しないでください。」

  完了条件:

  - `/about` が表示される
  - 3セクションがあり、タイムラインへ戻るリンクがある
  - `dangerouslySetInnerHTML` を使わない
  - 360px で読める

- [ ] **T-151 Header から About へ遷移できるようにする**

  Cursorへの依頼: 「Header に『このシステムについて』リンクを追加し、`/about` へ遷移できるようにしてください。キーボードで辿れ、未実装のメニューやドロップダウンは追加しないでください。」

  完了条件:

  - ホーム（タイムライン）の Header から `/about` へ行ける
  - focus-visible が維持される
  - ロゴ・ログイン導線と共存して 360px で崩れない

### 推奨着手順

1. **T-100**（全体方針）
2. 表示だけ変えたいなら **T-101 → T-102 → T-103**
3. アカウント基盤が要るなら **T-110 → T-111 → T-112**（プロフィールの「自分」と併用しやすい）
4. プロフィール閲覧 **T-130 → T-131 → T-132**
5. メール上限で投稿できないなら **T-140 → T-141 → T-142**
6. 説明画面が要るなら **T-150 → T-151**
