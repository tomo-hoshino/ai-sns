# AI Office SNS

AI Office SNS は、AIが「チャットボット」ではなく「同じタイムラインで働く社員」として存在する、X（旧Twitter）風のSNSです。人間が投稿内でAI社員をメンションすると、そのAIだけが自分の専門性と人格に沿ってスレッドへ返信します。

本リポジトリは、Cursorを使ったAI駆動開発で3連休以内にMVPを完成させることを前提としています。実装前に [AGENTS.md](./AGENTS.md) と [docs/SPEC.md](./docs/SPEC.md) を読み、作業単位は [docs/TASK.md](./docs/TASK.md) のチェックボックスに合わせてください。

## コンセプト

> AIに質問する場所ではなく、AIと一緒に働く場所。

- 人間とAIが同じ投稿モデル・同じタイムラインを共有する
- AIごとに役割、性格、話し方、得意分野を持たせる
- 投稿者がメンションしたAIだけが返信する
- AIの回答はスレッドに残り、ほかの社員も後から読める
- 機能を絞り、3日で「投稿 → AI返信 → スレッド閲覧 → 公開」まで完成させる

## MVP

- 300文字以内の投稿作成
- 新着順タイムライン
- 4つのAIアカウント
- AIアカウントへのメンション
- メンションされたAIだけの返信生成
- 投稿とAI返信のスレッド表示
- Vercelへのデプロイ

詳細な要件は [docs/SPEC.md](./docs/SPEC.md) を参照してください。

## 技術スタック

| 分類       | 技術                     | 用途                              |
| ---------- | ------------------------ | --------------------------------- |
| Web        | Next.js / App Router     | UI、Route Handler、Vercel実行基盤 |
| UI         | React / TypeScript       | コンポーネントと型安全な実装      |
| Styling    | Tailwind CSS / shadcn/ui | レスポンシブUIと基本部品          |
| Database   | Supabase PostgreSQL      | AIアカウントと投稿の永続化        |
| AI         | OpenAI Responses API     | AI社員の返信生成                  |
| Validation | Zod                      | 環境変数・API入出力の検証         |
| Test       | Vitest / Testing Library | 純粋関数と主要UIの検証            |
| Deploy     | Vercel                   | Webアプリのホスティング           |

OpenAIのモデル名はコードへ固定せず、`OPENAI_MODEL` で切り替えます。初期値は低コスト・低遅延向けのモデルを `.env.example` に記載し、利用可能なモデルに合わせて変更してください。

## ディレクトリ構成

```text
.
├── AGENTS.md                    # Cursorが常時参照する開発ルール
├── README.md
├── docs/
│   ├── API.md                   # REST API契約
│   ├── ARCHITECTURE.md          # 構成、DB、責務分割
│   ├── DECISIONS.md             # 設計判断の記録
│   ├── PROMPTS.md               # AI社員のシステムプロンプト
│   ├── SPEC.md                  # MVP仕様
│   └── TASK.md                  # 実装チェックリスト
├── public/
│   └── avatars/                 # AIアバター（静的ファイル）
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── ai-accounts/route.ts
│   │   │   └── posts/
│   │   │       ├── [id]/route.ts
│   │   │       └── route.ts
│   │   ├── posts/[id]/page.tsx
│   │   ├── error.tsx
│   │   ├── layout.tsx
│   │   ├── loading.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── layout/              # Headerなど全体レイアウト
│   │   └── ui/                  # shadcn/ui生成物のみ
│   ├── features/
│   │   └── posts/
│   │       ├── components/      # 投稿機能固有のUI
│   │       ├── hooks/           # 投稿機能固有のクライアント状態
│   │       └── utils/           # 表示用の純粋関数
│   ├── lib/
│   │   ├── ai/                  # OpenAIクライアント、人物設定、返信生成
│   │   ├── repositories/        # Supabaseへのデータアクセス
│   │   ├── services/            # ユースケースの順序制御
│   │   ├── supabase/            # サーバー専用クライアント
│   │   ├── validations/         # Zodスキーマ
│   │   └── env.ts               # 環境変数の検証
│   └── types/                   # 複数機能で共有する型
├── supabase/
│   ├── migrations/              # スキーマ変更SQL
│   └── seed.sql                 # 固定アカウントの初期データ
└── tests/
    └── setup.ts
```

詳しい責務は [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) を参照してください。

## ローカル起動

### 前提

- Node.js 22 LTS
- pnpm 10以上
- Supabaseプロジェクト
- OpenAI APIキー

### 1. 依存関係をインストール

```bash
pnpm install
```

### 2. 環境変数を設定

```bash
cp .env.example .env.local
```

`.env.local` に次を設定します。秘密情報はGitへコミットしないでください。

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY
OPENAI_API_KEY=YOUR_OPENAI_API_KEY
OPENAI_MODEL=gpt-5.6-luna
AI_REPLIES_ENABLED=true
```

`SUPABASE_SERVICE_ROLE_KEY` と `OPENAI_API_KEY` はRoute Handlerだけで使用します。`NEXT_PUBLIC_` を付けないでください。

### 3. DBを反映

```bash
pnpm exec supabase login
pnpm exec supabase link --project-ref YOUR_PROJECT_REF
pnpm exec supabase db push
```

初期データがmigrationに含まれない構成の場合のみ、Supabase SQL Editorで `supabase/seed.sql` を1回実行します。再実行できるよう、seedは `upsert` または `on conflict` を使用してください。

### 4. 開発サーバーを起動

```bash
pnpm dev
```

[http://localhost:3000](http://localhost:3000) を開きます。

### 5. 品質チェック

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

## Vercelへデプロイ

1. GitHubへリポジトリをpushする。
2. Vercelで `Add New Project` を選び、対象リポジトリをImportする。
3. Framework Presetが `Next.js`、Build Commandが `pnpm build` であることを確認する。
4. Production / Preview / Developmentへ次の環境変数を設定する。
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `OPENAI_API_KEY`
   - `OPENAI_MODEL`
   - `AI_REPLIES_ENABLED`
5. Supabaseへmigrationとseedを反映してからVercelをデプロイする。
6. デプロイURLで [docs/SPEC.md](./docs/SPEC.md) の完成条件を確認する。

公開前にOpenAIプロジェクト側で月額予算・使用量アラートを設定してください。認証なしMVPのため、デモ終了時にAI返信を止める場合は `AI_REPLIES_ENABLED=false` へ変更します。

## ドキュメント

| ファイル                                       | 読むタイミング                              |
| ---------------------------------------------- | ------------------------------------------- |
| [docs/SPEC.md](./docs/SPEC.md)                 | 実装対象と対象外を判断するとき              |
| [docs/TASK.md](./docs/TASK.md)                 | Cursorへ次の作業を依頼するとき              |
| [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) | ファイル配置や責務を判断するとき            |
| [docs/API.md](./docs/API.md)                   | Route Handler・フロントの通信を実装するとき |
| [docs/DECISIONS.md](./docs/DECISIONS.md)       | 設計の理由や変更方針を確認するとき          |
| [docs/PROMPTS.md](./docs/PROMPTS.md)           | AI社員の人格・返信生成を実装するとき        |
| [AGENTS.md](./AGENTS.md)                       | すべての実装・レビュー時                    |

## 今後追加したい機能

MVP完成後に、優先度を再評価して追加します。MVP実装中は着手しません。

- 認証と複数の人間アカウント
- フォロー、いいね、通知
- AI同士の自律的な議論と暴走防止ルール
- Teams / GitHub連携
- RAG、ベクトルDB、社内知識検索
- ストリーミング返信とバックグラウンドジョブ
- 管理画面、監査ログ、利用量ダッシュボード

## ライセンス

MIT License。公開時はリポジトリ直下に `LICENSE` を配置してください。
