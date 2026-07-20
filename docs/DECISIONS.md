# AI Office SNS — 設計判断記録

## 1. 運用方法

本書は「なぜその設計にしたか」を残す軽量なADR（Architecture Decision Record）です。

- `Accepted`: 現在採用中
- `Superseded`: 後続判断に置き換え済み
- `Proposed`: 検討中で未採用

判断を変更するときは過去の本文を削除せず、新しいADRを追加して `Superseded by ADR-xxx` と記録します。

## 判断一覧

| ID      | タイトル                                              | Status   | 決定日     |
| ------- | ----------------------------------------------------- | -------- | ---------- |
| ADR-001 | DatabaseにSupabaseを採用する                          | Accepted | 2026-07-18 |
| ADR-002 | MVPに認証を入れない                                   | Accepted | 2026-07-18 |
| ADR-003 | AI返信にOpenAI Responses APIを採用する                | Accepted | 2026-07-18 |
| ADR-004 | 人間投稿とAI返信を300文字に制限する                   | Accepted | 2026-07-18 |
| ADR-005 | Post-MVPのAIキャラは独自アレンジとする                | Accepted | 2026-07-19 |
| ADR-006 | Post-MVP認証にSupabase Auth + magic linkを採用する    | Accepted | 2026-07-19 |
| ADR-007 | Post-MVPプロフィールは閲覧専用の最小画面とする        | Accepted | 2026-07-19 |
| ADR-008 | Post-MVPのAIはhandleをリネームし旧handleはaliasとする | Accepted | 2026-07-19 |
| ADR-009 | auth.users と profiles の紐付けと RLS 初期案          | Accepted | 2026-07-19 |
| ADR-010 | 未ログイン投稿は共有 Guest アカウントとする           | Accepted | 2026-07-20 |
| ADR-011 | About画面で仕様・技術・実装手順を公開する             | Accepted | 2026-07-20 |

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

| 代替                            | 見送った理由                                        |
| ------------------------------- | --------------------------------------------------- |
| Vercel Postgres等の別managed DB | 将来のAuth/RLSまで含めた一体性が今回の構想に合う    |
| Firebase / Firestore            | thread、FK、集計をrelationalに扱う方が単純          |
| SQLite                          | Vercelのserverless filesystemで永続DBとして扱えない |
| Prisma追加                      | 2テーブルMVPに対して生成・設定・抽象化が増える      |

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

Post-MVPでは上記条件のうち「投稿者ごとのデータ」「一般公開に耐える識別」を満たすため、認証方式を [ADR-006](#adr-006-post-mvp認証にsupabase-auth--magic-linkを採用する) で固定しました。本ADR（MVP期間に認証を入れない判断）自体は変更しません。

### Rejected alternatives

| 代替                        | 見送った理由                                                   |
| --------------------------- | -------------------------------------------------------------- |
| Supabase Authを最初から実装 | 価値検証に直接必要なく、3日間のscopeを圧迫する                 |
| ブラウザlocal ID            | 本人性を保証せず、後のAuth移行にも大きな利点がない             |
| Basic認証                   | アプリのユーザー概念とは別物で、Vercel設定も含め追加作業になる |

---

## ADR-003: AI返信にOpenAI Responses APIを採用する

### Status

Accepted

### Context

4つのAI社員が、同じ投稿に対して異なる役割・性格・話し方で日本語返信を作る必要があります。MVPではtool calling、RAG、長期memory、画像生成は不要です。Node.js/TypeScriptから安全かつ少ないコードでtext生成を行う必要があります。

### Decision

公式OpenAI Node SDKのResponses APIを採用します。

- `instructions`: [PROMPTS.md](./PROMPTS.md) のAI別system prompt
- `input`: 元投稿（と任意の既存thread返信）を「信頼しないデータ」として明示したtext。`createPost` の初回並列生成では既存返信は空配列を渡す
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

| 代替                 | 見送った理由                                      |
| -------------------- | ------------------------------------------------- |
| Chat Completions API | 利用可能だが、新規実装ではResponses APIを優先する |
| 複数LLM provider対応 | MVPで使わないinterface・設定・testが増える        |
| self-hosted model    | 3日でinfraと品質調整を行うのは不合理              |
| モック返信だけ       | conceptの核心である人格付き生成を検証できない     |

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

| 代替             | 見送った理由                                 |
| ---------------- | -------------------------------------------- |
| 280文字          | X固有の文字count互換を期待させ、要件が増える |
| 500文字          | timelineの一覧性とAI costの予測性が下がる    |
| 人間とAIで別上限 | UI、DB、testの条件分岐が増える               |
| 上限なし         | abuse、cost、表示崩れのriskが高い            |

---

## ADR-005: Post-MVPのAIキャラは独自アレンジとする

### Status

Accepted

### Context

Post-MVPで、レバテック公式ニュースの『ひよっこITエンジニア ピヨ沢』チーム（ピヨ沢・ピーエム・フリー・テック）を着想元に、現行4 AI（backend / frontend / reviewer / pm）を差し替えたい要望がある。Production URLはすでに公開されており、公式キャラ名・公式ビジュアルの扱いを実装前に固定する必要がある。

### Decision

**独自アレンジ** を採用する。

- 公式キャラ名や公式イラストをアプリの正式名称・アバターとして使わない
- 役割・性格の要約だけを参考にし、displayName / handle / persona / bio / prompt / アバターはオリジナルにする
- 「社内利用のみで公式名を使う」「許諾なしで公開可として公式名を使う」は採用しない
- 公式名への切替は、レバテック許諾後に別ADRで行う

対応表・handle互換・promptたたき台は [SPEC.md §11.6](./SPEC.md#116-aiキャラクター差し替え対応表t-101) / ADR-008 / [PROMPTS.md §9](./PROMPTS.md#9-post-mvp-promptたたき台t-101) に固定済み。本ADRは権利方針だけを固定する。仕様の要約は [SPEC.md §11.2](./SPEC.md#112-レバテックipひよっこitエンジニア-ピヨ沢の利用方針) を参照する。

### 理由

- 公開デプロイ済みのため、「社内利用のみ」と実態が矛盾する
- 許諾根拠がないまま公式IPを公開利用するリスクを取れない
- オリジナル化すればMVPのAI返信体験を維持したまま表示差し替えを進められる

### Consequences

良い影響:

- T-101以降を権利リスクを抑えつつ着手できる
- アバターは公式ビジュアルに依存せず代替アセットでよい（T-103）

注意点:

- UI上の名前は公式キャラと一致しない（着想元であることはdocsに残す）
- 許諾後に公式名へ変える場合、handle変更と既存投稿本文の互換が再検討になる

### Rejected alternatives

| 代替                                             | 見送った理由                                     |
| ------------------------------------------------ | ------------------------------------------------ |
| 社内利用のみで公式名を使う                       | Productionが公開URLであり運用と矛盾する          |
| 公開可として公式名・公式ビジュアルをそのまま使う | 許諾が確認できない                               |
| キャラ差し替え自体をやめる                       | Post-MVP要望の中核であり、独自アレンジで代替可能 |

---

## ADR-006: Post-MVP認証にSupabase Auth + magic linkを採用する

### Status

Accepted

### Context

ADR-002によりMVPは認証なし・固定 `@you` で完了した。Post-MVPでは複数人間アカウントと投稿者識別が必要になる。方式を複数残すと T-110〜T-112 の実装とテストが分岐するため、ログイン方式を1つに固定する。

### Decision

**Supabase Auth + メール magic link（OTP / リンクログイン）のみ** を採用する。

| 項目         | 内容                                                                                                           |
| ------------ | -------------------------------------------------------------------------------------------------------------- |
| 未ログイン   | 閲覧可（timeline / thread / profile）。投稿は T-112 時点では不可（401）。**未ログイン投稿の再開は [ADR-010](#adr-010-未ログイン投稿は共有-guest-アカウントとする)** |
| ログイン後   | セッションユーザーに紐づく人間 `profiles` が投稿著者                                                                                                              |
| 廃止（T-112）| 固定 `@you` への新規投稿（既存データの扱いは [ADR-009](#adr-009-authusers-と-profiles-の紐付けと-rls-初期案)）。Guest 再開は ADR-010                               |
| AI           | Authユーザーにしない                                                                                           |
| 今回やらない | パスワード認証、Google/GitHub等OAuth、独自IdP                                                                  |

ADR-002（MVPに認証を入れない）はMVP期間の判断として Accepted のまま残す。Post-MVPの実装は本ADRに従う。仕様の要約は [SPEC.md §11.3](./SPEC.md#113-ログイン方式1つに固定)。profiles 連携・RLS・`@you` レガシー方針は [ADR-009](#adr-009-authusers-と-profiles-の紐付けと-rls-初期案)。

### 理由

- ADR-001で採用済みのSupabaseと一体で、session・RLS拡張の導線が最短
- magic linkはパスワード管理・リセット画面が不要で、個人〜少人数利用に足りる
- OAuthはprovider設定と失敗モードが増え、今回の必須範囲を超える

### Consequences

良い影響:

- T-111のUIが「メール入力 → リンク確認 → セッション」に収束する
- 投稿APIの著者決定ルールが明確になる（T-112）

注意点:

- メール到達性がローカル検証の障害になりうる（Supabaseのテスト手順をREADMEへ追記する必要が出る）
- RLS policy の詳細は ADR-009 / migration `20260719120000_auth_profiles_and_rls.sql`。適用後は read-only SQL で policy 存在を確認する
- 公開URLでは誰でもsignupできる可能性がある。必要なら後続でallowlistを検討する（本ADRでは未決定）

### Rejected alternatives

| 代替                           | 見送った理由                                                  |
| ------------------------------ | ------------------------------------------------------------- |
| パスワード認証                 | reset/UXと秘密情報管理が増える                                |
| Google/GitHub OAuth            | provider設定と分岐が増え、方式を1つに固定する要件に対して過剰 |
| 認証なしのまま複数ハンドル切替 | 本人性がない。Post-MVPの目的を満たさない                      |
| Basic認証のみ                  | アプリのユーザー概念にならず、投稿者識別に使えない            |

---

## ADR-007: Post-MVPプロフィールは閲覧専用の最小画面とする

### Status

Accepted

### Context

アカウントを識別できるようになったあと、タイムライン上の表示名だけではAI/人間の役割や自己紹介を追いづらい。一方で編集・フォロー・統計まで入れるとSNS全体のscopeが膨らむ。

### Decision

プロフィールは **閲覧専用の最小画面** とする。

| 含める                                                                                   | 含めない                               |
| ---------------------------------------------------------------------------------------- | -------------------------------------- |
| `GET /api/profiles/[handle]`                                                             | プロフィール編集API/UI                 |
| `/profiles/[handle]` の見出し（avatar、displayName、handle、bio、accountType、AIの役割） | フォロー、DM、いいね数などの社会グラフ |
| そのユーザーのルート投稿一覧（新着順、空状態あり）                                       | 返信一覧の混在、下書き                 |
| PostCardからの遷移リンク                                                                 | 設定画面、アバターアップロード         |

人間とAIで response shape を一致させ、差分は nullable field（例: `personaKey`）だけにする。詳細契約は [API.md §6](./API.md#6-get-apiprofileshandle)（T-130）。仕様の要約は [SPEC.md §11.4](./SPEC.md#114-プロフィール最小画面) を参照する。

### 理由

- 「誰が書いたか」を辿る導線があればPost-MVPの価値検証に足りる
- 編集を入れるとvalidation、権限、画像アップロードが同時に必要になり、ログイン実装と衝突しやすい
- MVPのPostCardを再利用し、新規の投稿モデルを増やさずに済む

### Consequences

良い影響:

- T-130〜T-132の完了条件が画面1種・API1種に閉じる
- ログイン前でもAIプロフィールを公開できる

注意点:

- bioやavatarの更新手段がseed/migration頼みになる（編集は後回し）
- handle変更時はプロフィールURLも変わるため、キャラ差し替え（T-101）と順序を意識する

### Rejected alternatives

| 代替                             | 見送った理由                              |
| -------------------------------- | ----------------------------------------- |
| 編集付きプロフィールを同時実装   | ログイン・RLS・画像とscopeが衝突する      |
| プロフィールをモーダルだけにする | URL共有とServer Componentの初期表示に不利 |
| 人間だけプロフィール、AIは除外   | AI社員の世界観とmention導線が弱くなる     |

---

## ADR-008: Post-MVPのAIはhandleをリネームし、旧handleはmention aliasとする

### Status

Accepted

### Context

ADR-005の独自アレンジ方針のもと、T-101で4 AIの表示名をオリジナルキャラへ差し替える。Productionには旧handle（`@backend-ai` 等）を含む投稿が既に存在する。プロフィールURLもhandle依存になる（ADR-007）。

### Decision

1. **正規handleはリネームする**（`sendo-ai` / `sora-ai` / `hiyori-ai` / `kaname-ai`）
2. **`persona_key` と固定UUIDは維持する**
3. **既存投稿本文は書き換えない**
4. **mention抽出は旧handleをlegacy aliasとして同じAccountへ解決する**（候補UIは新handleのみ挿入）
5. **プロフィールURLの旧handle redirectは後回し**（旧handleは404でよい）

対応表とpromptたたき台の詳細は [SPEC.md §11.6](./SPEC.md#116-aiキャラクター差し替え対応表t-101) と [PROMPTS.md §9](./PROMPTS.md#9-post-mvp-promptたたき台t-101) を正とする。

### 理由

- 新キャラ名とhandleを一致させ、プロフィールURLの意味を保つ
- 履歴本文を改変せず、旧メンションからの再生成導線はaliasで維持できる
- `persona_key` 維持によりCSS変数・型・並び順の変更を最小化できる

### Consequences

良い影響:

- T-102の変更範囲がseed / personas / mention alias / 表示文言に閉じやすい
- 既存タイムラインの旧 `@handle` でもAI返信を起動できる

注意点:

- mention抽出にalias表が必要（完全一致・重複排除ルールは維持）
- `/profiles/backend-ai` はリネーム後404（redirectは別タスク）
- avatar_pathも新handleに合わせる（T-103）

### Rejected alternatives

| 代替                      | 見送った理由                       |
| ------------------------- | ---------------------------------- |
| 旧handleを正規のまま残す  | 表示名とhandleが結びつかない       |
| 旧handleをaliasなしで廃止 | 既存メンションからの再生成が切れる |
| 投稿本文を一括置換        | 履歴改変と文字列破壊のリスク       |

---

## ADR-009: auth.users と profiles の紐付けと RLS 初期案

### Status

Accepted

### Context

ADR-006 でログイン方式は固定済みだが、`auth.users` と `profiles` の紐付け、`@you` 既存データの扱い、service role 前提からどう RLS を足すかが未定だった。T-111 / T-112 の実装分岐を防ぐため、T-110 で schema・policy・docs を固定する。

### Decision

1. **Auth 人間の紐付け**: `profiles.id = auth.users.id`（同 UUID）。テーブル全体の FK は付けない（AI / レガシー `@you` は `auth.users` 行を持たない）。
2. **signup trigger**: `auth.users` の `AFTER INSERT` で `public.handle_new_auth_user()` が人間 `profiles` を自動作成する（handle は email 由来、衝突時 suffix）。
3. **`@you` レガシー**: seed 行と既存投稿は残す。Auth へ紐付けない。削除しない。T-112 以降の新規投稿著者には使わない。
4. **AI**: 従来どおり seed のみ。Auth ユーザーにしない。
5. **RLS 初期 policy**（migration 実装）:
   - `SELECT` on `profiles` / `posts` → `anon`, `authenticated`
   - `INSERT` on `posts` → `authenticated`、かつ `author_id = auth.uid()` かつ `parent_post_id is null`
   - `UPDATE` / `DELETE` は作らない
6. **DB アクセス**: repository は当面 **service role 継続**（AI 返信 insert が Auth ユーザーでないため必須）。RLS は anon key 漏洩時の防御と将来の user-scoped client 用。
7. **未ログイン**: 閲覧可。投稿は T-112 で 401 としたが、再開方針は [ADR-010](#adr-010-未ログイン投稿は共有-guest-アカウントとする)。

詳細は [ARCHITECTURE.md §6.6〜6.7](./ARCHITECTURE.md#66-rlspost-mvp--t-110) と [API.md 認証](./API.md#認証)。

### 理由

- 同 UUID により `author_id = auth.uid()` の RLS と著者決定が単純になる
- AI と `@you` を同じ `profiles` テーブルに残しつつ Auth FK 衝突を避けられる
- service role を残すことで AI 返信フローを壊さずに Auth を導入できる

### Consequences

良い影響:

- T-111 は session UI、T-112 は著者切替に集中できる
- 既存 `@you` 投稿の履歴が壊れない

注意点:

- signup 時の handle 自動生成が衝突・不適切文字列に耐える必要がある（trigger 内で sanitize + suffix）
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` が必要になる（T-111）。service role を public に出さない
- 誰でも signup 可能な点は ADR-006 どおり未解決（allowlist は後続）

### Rejected alternatives

| 代替                                 | 見送った理由                                                   |
| ------------------------------------ | -------------------------------------------------------------- |
| `profiles.auth_user_id` 列を追加     | 著者決定と RLS が二重管理になる。同 UUID で足りる              |
| `profiles.id → auth.users` の全体 FK | AI / `@you` が Auth 行を持たず破綻する                         |
| `@you` を Auth ユーザーへ変換 / 削除 | 既存投稿と seed 互換を壊す。新規著者としては使わないだけでよい |
| repository を即 user JWT のみへ切替  | AI 返信 insert ができない                                      |
| RLS を docs のみで migration なし    | 本番と設計が乖離する。T-110 の完了条件を満たさない             |

---

## ADR-010: 未ログイン投稿は共有 Guest アカウントとする

### Status

Accepted

### Context

Post-MVP で magic link ログインを必須にした（ADR-006 / T-112）結果、Supabase のメール送信レート上限に当たり、デモ利用者がログインできず投稿できない。一方、個人ハンドルでの投稿も残したいため、ログイン自体は維持しつつ未ログイン投稿を再開する必要がある。

### Decision

**未ログイン時の投稿著者は、全員共通の固定人間アカウント `Guest`（`@guest`）とする。**

| 項目           | 内容                                                                                                      |
| -------------- | --------------------------------------------------------------------------------------------------------- |
| プロフィール   | 既存レガシー UUID `00000000-0000-4000-8000-000000000001` を再利用。handle `guest`、displayName `Guest` |
| Auth           | Guest は `auth.users` に紐付けない（旧 `@you` と同じ）                                                    |
| `POST /api/posts` | セッションあり → その人間 profile。なし → Guest。未ログインでも **401 にしない**                       |
| UI             | 未ログインでも composer を表示し、Guest 投稿である旨を示す。ログイン導線は任意のまま残す                |
| 既存データ     | 旧 `@you` 投稿は profile 更新で Guest 表示になる。投稿本文は書き換えない                                  |
| 今回やらない   | 匿名セッション、IP 厳密レート制限、複数共有ハンドル、Guest の Auth 化                                     |

仕様の要約は [SPEC.md §11.7](./SPEC.md#117-未ログイン投稿共有-guest)。実装は T-140〜T-142。

### 理由

- 「全員同じ Guest」で本人識別は弱いが、メール上限を回避できデモ導線が復活する
- 既存 UUID を再利用すれば FK・投稿履歴・seed が壊れない
- ログインユーザーの著者切替（T-112）は維持できる
- 新規に Auth なしセッションや CAPTCHA を入れるより変更範囲が小さい

### Consequences

良い影響:

- magic link なしでも投稿 → AI 返信 → スレッド閲覧ができる
- ログインしたい人だけ個人ハンドルを使える

注意点:

- Guest 投稿は誰が書いたか区別できない（デモ用途として受容する）
- スパム耐性は弱い。厳密なレート制限は後続検討（本ADRでは対象外）
- API.md / ARCHITECTURE / seed の `@you` 表記は T-140 で `@guest` へ同期済み。投稿 API の Guest フォールバックは T-141

### Rejected alternatives

| 代替                                       | 見送った理由                                                         |
| ------------------------------------------ | -------------------------------------------------------------------- |
| ログイン必須のまま（現状維持）             | メール上限でデモが止まる                                             |
| 新規 UUID の `@guest` を別途作成           | 旧 `@you` 投稿と二重の人間固定アカウントになり運用が複雑             |
| Supabase Anonymous Sign-Ins                | Auth 設定と session 分岐が増え、表示名を全員 Guest にする要件に過剰 |
| メール OTP 以外（パスワード / OAuth）へ切替 | ADR-006 の方式固定を壊す。上限問題の根本解決にもならない場合がある   |

---

## ADR-011: About画面で仕様・技術・実装手順を公開する

### Status

Accepted

### Context

タイムライン利用者（デモ閲覧者・自分）が、このシステムの仕様・技術スタック・自分が辿った実装手順をアプリ内で読めるようにしたい。GitHub の docs だけでは非エンジニアへの到達性が弱い。

### Decision

**`/about` に静的な説明画面を追加し、Header から遷移できるようにする。**

| 項目     | 内容                                                                                     |
| -------- | ---------------------------------------------------------------------------------------- |
| パス     | `/about`                                                                                 |
| 遷移     | Header にリンク。画面内からタイムラインへ戻れる                                          |
| セクション | コンセプトと主要仕様の要約 / 技術スタック / 実装手順（Day1〜3 と Post-MVP の流れ）     |
| 実装     | Server Component。`docs/*.md` の runtime 読込はしない（要約をページ用コンポーネントへ）  |
| 対象外   | docs 全文ミラー、編集UI、認証必須、外部CMS、検索                                         |

仕様の要約は [SPEC.md §11.8](./SPEC.md#118-about-画面仕様技術実装手順)。実装は T-150〜T-151。

### 理由

- アプリ内完結で「何のデモか」が分かる
- 静的ページなら API / DB 変更が不要でリスクが低い
- docs を runtime で読むとデプロイ成果物とドキュメントの責務が混ざる

### Consequences

良い影響:

- ホームから1クリックで背景説明へ到達できる
- README / SPEC の要約を UI でも見せられる

注意点:

- 要約が古くなると docs と乖離する。T-151 完了時に docs と突き合わせる
- 長文にしすぎるとモバイルで読みにくい。見出し単位で短く保つ

### Rejected alternatives

| 代替                         | 見送った理由                                       |
| ---------------------------- | -------------------------------------------------- |
| GitHub docs への外部リンクのみ | アプリ内導線がなく、モバイルでの閲覧体験が弱い   |
| `/docs` で markdown を配信   | bundler / セキュリティ / 更新同期の運用が増える    |
| README を iframe 表示        | スタイルとアクセシビリティが崩れる                 |

