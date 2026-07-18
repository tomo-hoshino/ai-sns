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

- [ ] **T-011 AIアカウント一覧serviceとGET APIを実装する**

  Cursorへの依頼: 「`get-ai-accounts.ts` と `GET /api/ai-accounts` をAPI.mdどおりに実装してください。AIだけを `backend`、`frontend`、`reviewer`、`pm` の固定順で返し、1時間のs-maxageとstale-while-revalidateを設定してください。persona key不正やDB失敗を握りつぶさないでください。」

  完了条件:

  - 人間アカウントを返さない
  - 並び順がDB作成日時に依存しない
  - cache headerとerror responseがAPI.mdどおり

## Day 2 — 投稿API、タイムラインUI、スレッド

### D. 投稿API

- [ ] **T-012 メンション抽出を実装する**

  Cursorへの依頼: 「SPEC.mdのルールどおり、本文とAIアカウント配列から有効なAIを抽出する純粋関数を `src/lib/ai/mentions.ts` に実装してください。大文字小文字を無視し、完全一致、重複排除、出現順維持、最大4件を保証してください。存在しないhandle、似たhandle、句読点、改行、重複、大文字を含む単体テストを追加してください。」

  完了条件:

  - `@backend-ai-test` がbackend AIに一致しない
  - 同じAIは1件になる
  - 戻り値がDB取得済みAccountで、handle文字列だけではない
  - 全境界ケースのテストが成功する

- [ ] **T-013 AI生成なしの投稿作成serviceを実装する**

  Cursorへの依頼: 「まずAI呼び出しを行わない `createPost` serviceを実装してください。固定 `@you` を取得し、trim済み本文をルート投稿として保存し、有効AIメンション一覧を返してください。依存するrepositoryを引数で差し替えられる関数にし、投稿保存失敗時のテストを作成してください。AI生成は次タスク用のinterfaceだけ定義し、仮返信を生成しないでください。」

  完了条件:

  - 人間投稿が常に `parentPostId: null`
  - 人間アカウント不在とDB保存失敗が明示的なdomain errorになる
  - unit testで実DB・OpenAIを呼ばない

- [ ] **T-014 POST APIを実装する**

  Cursorへの依頼: 「`POST /api/posts` をAPI.mdどおりに実装してください。Content-Type、JSON parse、strict Zod schema、1〜300文字を検証し、createPost serviceを呼んで201を返してください。この時点ではAI generatorが未接続のため、有効メンションなしのケースを完成させ、generator依存を差し込める構造にしてください。400/500はrequest ID付きの共通error shapeにしてください。」

  完了条件:

  - メンションなしで `aiReplyStatus: "not_requested"`
  - 空文字、301文字、未知field、壊れたJSONが400
  - DB失敗が秘密情報なしの500
  - 人間投稿成功時が201

### E. 投稿一覧・投稿UI

- [ ] **T-015 全体レイアウトとデザイントークンを実装する**

  Cursorへの依頼: 「AI社員が働くSNSらしい、落ち着いたオフィス調の全体レイアウトを実装してください。Header、最大幅 `max-w-2xl` のmain、背景・文字・border・AI別accentをTailwindのCSS変数または既存themeで定義してください。モバイル360pxを基準にし、dark mode切替やサイドバーは追加しないでください。日本語font stackとmetadataも設定してください。」

  完了条件:

  - `/` が360pxと1280pxで横スクロールしない
  - Headerはロゴ/名称だけで、未実装navがない
  - focus-visibleが確認できる

- [ ] **T-016 PostCardとPostListを実装する**

  Cursorへの依頼: 「domain型だけをpropsに使い、`PostCard` と `PostList` を単一責任で実装してください。アバター、表示名、handle、AI badge、相対時刻、本文、返信件数、threadリンクを表示してください。本文は通常のReact textとして描画し、有効メンション部分だけ安全に分割して強調してください。空状態とcomponent testも追加してください。」

  完了条件:

  - `dangerouslySetInnerHTML` を使わない
  - 人間とAIの表示差がbadgeとaccentで判別できる
  - `time` 要素にISOの `dateTime` がある
  - PostCard内にAPI fetchや状態管理がない

- [ ] **T-017 タイムライン初期表示を実装する**

  Cursorへの依頼: 「`src/app/page.tsx` をServer Componentとして実装し、`listTimelinePosts` serviceから初期20件を取得してPostListへ渡してください。loading.tsxに投稿カード型skeleton、error.tsxに再試行UIを実装してください。pageから自分自身のREST APIをfetchせず、serviceを直接利用してください。」

  完了条件:

  - 初期表示がServer Component
  - loading、empty、errorの3状態がある
  - service/repositoryの例外を画面へそのまま表示しない

- [ ] **T-018 追加読込を実装する**

  Cursorへの依頼: 「`LoadMoreButton` をClient Componentで実装し、初期レスポンスのnextCursorを使って `GET /api/posts` から次ページを取得してください。取得中のdisabled、重複IDの除外、失敗時の再試行、hasMore=falseでボタン非表示を実装してください。無限スクロールやSWR/React Queryは導入しないでください。」

  完了条件:

  - cursorを改変せずAPIへ渡す
  - 連打で同時requestが発生しない
  - 同じPostが重複表示されない
  - エラー時に既存Postが消えない

- [ ] **T-019 AIメンション候補UIを実装する**

  Cursorへの依頼: 「4つのAIアカウントをコンパクトなbutton/chipとして表示する `AiMentionList` を実装してください。クリック時に選択handleをcallbackし、アバター、表示名、handle、役割がキーボードとスクリーンリーダーで理解できるようにしてください。自動補完popoverや検索機能は追加しないでください。」

  完了条件:

  - 4つのAIが表示される
  - Tab/Enter/Spaceで選べる
  - buttonに説明可能なaccessible nameがある
  - 選択処理以外のフォーム状態を持たない

- [ ] **T-020 PostComposerを実装する**

  Cursorへの依頼: 「`PostComposer` をClient Componentで実装してください。Textarea、Unicode基準の文字数表示、AI候補からカーソル位置へのmention挿入、1〜300文字validation、送信中disabled、`POST /api/posts` 呼び出し、成功時clearと `router.refresh()`、失敗時入力保持、Sonner通知を実装してください。二重送信と301文字入力を防いでください。」

  完了条件:

  - 0、1、300、301文字のcomponent testがある
  - mention選択で既存本文を壊さない
  - API 201のpartial/failed/disabledを適切な通知へ変換する
  - API error messageを安全に表示する

### F. スレッド表示

- [ ] **T-021 thread取得serviceとGET APIを実装する**

  Cursorへの依頼: 「`get-thread.ts` と `GET /api/posts/[id]` をAPI.mdどおり実装してください。UUIDを検証し、ルート投稿と直下返信を取得し、返信を古い順で返してください。ルート不在または返信ID指定は404、DB失敗は500にしてください。`Cache-Control: no-store` とrequest IDを設定してください。」

  完了条件:

  - 正常、返信0件、不正UUID、ルートなし、返信ID、DB失敗をテストできる
  - 多階層返信を仮実装しない
  - API responseがAPI.mdと一致する

- [ ] **T-022 スレッド画面を実装する**

  Cursorへの依頼: 「`/posts/[id]` をServer Componentで実装してください。ルートPostを強調し、返信を時系列で縦に表示するThread component、timelineへ戻るリンク、返信0件の表示、loading UIを追加してください。存在しないルートはNext.jsの `notFound()` を使ってください。人間の返信フォームは追加しないでください。」

  完了条件:

  - rootとrepliesが視覚的に同じthreadだと分かる
  - 404と戻る導線がある
  - 360pxで崩れない
  - PostCardを再利用し、thread専用の重複カードを作らない

## Day 3 — AI返信、品質確認、デプロイ

### G. AI返信

- [ ] **T-023 persona定義をコード化する**

  Cursorへの依頼: 「PROMPTS.mdの4つのsystem promptを `src/lib/ai/personas.ts` に型安全なreadonly mapとして実装してください。persona keyは `backend | frontend | reviewer | pm` のunionとし、DBのAIアカウントが未知のpersona keyなら明示的に失敗させてください。promptをDBへ複製せず、prompt内容がPROMPTS.mdと一致するテストを追加してください。」

  完了条件:

  - 4 personaが欠けていないことを `satisfies` で保証する
  - 文字列キーへの無制限index accessがない
  - promptに300文字、prompt injection、機密情報のルールがある

- [ ] **T-024 OpenAI clientと1件の返信生成を実装する**

  Cursorへの依頼: 「公式OpenAI Node SDKのResponses APIを使い、`generate-reply.ts` に1 AI分の返信生成を実装してください。modelは `OPENAI_MODEL`、system指示はpersona、inputは信頼しないデータとして区切ったroot postと既存返信最大20件、`store: false`、適切な `max_output_tokens` を指定してください。`output_text` をtrimし、空文字は失敗、300文字超は `Array.from` で安全に切り詰めてください。API keyやpromptをログへ出さないでください。」

  完了条件:

  - OpenAI SDKはserver-onlyモジュールからだけ利用する
  - model名をコードへ直書きしない
  - network失敗、空出力、長文のテストがある
  - AI出力をHTMLとして扱わない

- [ ] **T-025 createPostへAI返信を統合する**

  Cursorへの依頼: 「createPost serviceへAI返信生成を統合してください。人間投稿を先に保存し、有効AIごとに `Promise.allSettled` でgenerate→返信保存を独立実行し、API.mdの `aiReplyStatus`、`succeededAiHandles`、`failedAi` を組み立ててください。AI返信を入力に再度mention解析せず、再帰生成を禁止してください。`AI_REPLIES_ENABLED=false` ではOpenAIを呼ばずdisabledを返してください。」

  完了条件:

  - 0件、1件、複数、重複、部分失敗、全失敗、disabledのtestがある
  - AI失敗でも人間投稿を削除しない
  - 1 AIにつき返信は最大1件
  - 失敗AIのhandleと安全なcodeだけをAPIへ返す

- [ ] **T-026 POST APIとUIのAI返信結果を完成させる**

  Cursorへの依頼: 「POST /api/postsが統合済みcreatePostの結果をAPI.mdどおり201で返すよう完成させ、PostComposerでcompleted/partial/failed/disabled/not_requestedを区別して通知してください。成功後は `router.refresh()` し、AI返信を含む返信件数がtimelineへ反映されることを確認してください。OpenAI失敗をHTTP 500へ変換しないでください。」

  完了条件:

  - API契約testが5つのstatusを網羅する
  - 部分失敗でも成功通知と注意通知を区別できる
  - threadで生成済み返信を確認できる

### H. 品質確認

- [ ] **T-027 エラー・ローディング・アクセシビリティを通し確認する**

  Cursorへの依頼: 「SPEC.mdのユーザーストーリーに沿って、timeline、composer、load more、threadのloading/empty/error/disabled状態を確認し、不足だけを修正してください。label、aria-live、focus-visible、button type、time datetime、キーボード操作、色コントラストを点検してください。デザイン刷新や新機能追加は行わないでください。」

  完了条件:

  - 送信結果がaria-liveで通知される
  - マウスなしで投稿・mention・thread移動ができる
  - errorから再試行できる

- [ ] **T-028 セキュリティと秘密情報を確認する**

  Cursorへの依頼: 「リポジトリ全体を検索し、service role key/OpenAI keyの実値、`NEXT_PUBLIC_` の誤用、client componentからserver moduleへのimport、`dangerouslySetInnerHTML`、投稿全文やsystem promptのログ、未検証入力がないか確認してください。発見したMVP範囲内の問題を修正し、確認結果を報告してください。」

  完了条件:

  - 秘密情報の実値がGit管理ファイルにない
  - browser bundleから秘密値へ到達できない
  - 外部入力がZod検証される
  - RLSが有効で公開policyがない

- [ ] **T-029 自動品質チェックをすべて通す**

  Cursorへの依頼: 「`pnpm format:check`、`pnpm lint`、`pnpm typecheck`、`pnpm test`、`pnpm build` を順に実行し、失敗原因を根本から修正してください。test削除、lint rule無効化、型アサーション追加だけで通さないでください。最終結果と未解決warningを報告してください。」

  完了条件:

  - 5コマンドがすべてexit code 0
  - `any`、`@ts-ignore`、理由のないeslint-disableがない
  - testが主要な境界条件を保持している

- [ ] **T-030 手動受け入れテストを実施する**

  Cursorへの依頼: 「SPEC.mdの完成条件を手動テスト用チェックリストとして実行してください。特にメンションなし、単一AI、複数AI、重複AI、未知AI、300/301文字、AI API失敗、存在しないthread、360px/1280pxを確認し、結果をこのタスク配下の実施記録へ追記してください。不具合はMVP範囲だけ修正してください。」

  完了条件:

  - 完成条件の各項目にPass/Failと確認日がある
  - Failが0件
  - OpenAI利用量が想定外に増えていない

### I. Vercelデプロイ

- [ ] **T-031 Supabase本番環境を準備する**

  Cursorへの依頼: 「READMEの手順に従い、本番Supabase projectへmigrationとseedを反映するためのコマンドと確認SQLを提示してください。破壊的resetは行わず、対象project refを実行前に確認してください。反映後、5 profiles、0件以上のposts、RLS、indexをread-only SQLで確認してください。」

  完了条件:

  - 本番project refを取り違えていない
  - migration履歴が適用済み
  - 固定アカウント5件が存在する
  - RLSとindexが確認できる

- [ ] **T-032 Vercelへデプロイする**

  Cursorへの依頼: 「READMEの手順に従いVercelへデプロイしてください。`NEXT_PUBLIC_SUPABASE_URL`、`SUPABASE_SERVICE_ROLE_KEY`、`OPENAI_API_KEY`、`OPENAI_MODEL`、`AI_REPLIES_ENABLED` の存在を値を表示せず確認し、Production buildを実行してください。設定変更や外部書き込みの直前には対象を明示してください。」

  完了条件:

  - Production deploymentがReady
  - build logに秘密値がない
  - Production URLがHTTPSで開く

- [ ] **T-033 本番スモークテストと運用ガードを確認する**

  Cursorへの依頼: 「Production URLでtimeline表示、通常投稿、単一AI mention、thread表示を1回ずつ確認してください。OpenAI projectの月額予算/使用量アラートが設定されていること、緊急停止用 `AI_REPLIES_ENABLED=false` の変更手順がREADMEにあることを確認してください。テスト投稿以外のデータを削除しないでください。」

  完了条件:

  - 本番の主要導線がPass
  - AI返信が指定した1 AIからだけ返る
  - 予算・停止手段が確認できる
  - Production URLをREADMEまたはリポジトリ説明へ記録する

- [ ] **T-034 ドキュメントと実装を最終同期する**

  Cursorへの依頼: 「README、SPEC、TASK、ARCHITECTURE、API、DECISIONS、PROMPTS、AGENTSと実装を比較し、パス、env名、API shape、DB列、AI名、コマンドの不一致だけを修正してください。将来案をMVP実装済みのように書かないでください。最後に変更したドキュメントと理由を報告してください。」

  完了条件:

  - 8ドキュメントとコードに既知の不一致がない
  - 完成条件がすべて `[x]`
  - 実装していない将来機能が明確に区別されている

## 実施記録

手動テスト時に追記します。

| 日付       | 環境                         | Commit    | 結果        | 備考           |
| ---------- | ---------------------------- | --------- | ----------- | -------------- |
| YYYY-MM-DD | Local / Preview / Production | `abcdef0` | Pass / Fail | 事実だけを記載 |
