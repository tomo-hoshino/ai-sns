export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 px-6 py-16 text-zinc-900">
      <div className="max-w-lg text-center">
        <p className="text-sm font-medium tracking-wide text-zinc-500">
          AI Office SNS
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
          開発サーバー起動中
        </h1>
        <p className="mt-4 text-base leading-7 text-zinc-600">
          Next.js App Router の初期化（T-001）が完了しました。タイムラインや投稿UIは後続タスクで実装します。
        </p>
      </div>
    </main>
  );
}
