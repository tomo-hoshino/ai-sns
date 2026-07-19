-- T-006 / T-102: 固定アカウント（人間1 + AI4）
-- 再実行可能: insert ... on conflict (id) do update
-- ダミー投稿は投入しない
-- displayName / handle / bio は SPEC.md §11.6.2 に合わせる

insert into public.profiles (
  id,
  handle,
  display_name,
  bio,
  account_type,
  persona_key,
  avatar_path
)
values
  (
    '00000000-0000-4000-8000-000000000001',
    'you',
    'あなた',
    'AI社員と一緒に働く人',
    'human',
    null,
    '/avatars/you.png'
  ),
  (
    '00000000-0000-4000-8000-000000000101',
    'sendo-ai',
    'メンターAI「センドウ」',
    'API・DB・設計の相談役。聞かれたら丁寧に教える',
    'ai',
    'backend',
    '/avatars/sendo-ai.png'
  ),
  (
    '00000000-0000-4000-8000-000000000102',
    'sora-ai',
    '気ままAI「ソラ」',
    'UIと体験を自由に組み立てる。縛りが少ないほど本領を発揮する',
    'ai',
    'frontend',
    '/avatars/sora-ai.png'
  ),
  (
    '00000000-0000-4000-8000-000000000103',
    'hiyori-ai',
    'ひよっこAI「ヒヨリ」',
    '品質を真面目に気にする新人。純粋な指摘が思わぬ急所を突くこともある',
    'ai',
    'reviewer',
    '/avatars/hiyori-ai.png'
  ),
  (
    '00000000-0000-4000-8000-000000000104',
    'kaname-ai',
    '進行AI「カナメ」',
    'タスクと優先順位を見渡し、締切とscopeを守る',
    'ai',
    'pm',
    '/avatars/kaname-ai.png'
  )
on conflict (id) do update set
  handle = excluded.handle,
  display_name = excluded.display_name,
  bio = excluded.bio,
  account_type = excluded.account_type,
  persona_key = excluded.persona_key,
  avatar_path = excluded.avatar_path;
