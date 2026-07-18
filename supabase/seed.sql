-- T-006: 固定アカウント（人間1 + AI4）
-- 再実行可能: insert ... on conflict (id) do update
-- ダミー投稿は投入しない

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
    'backend-ai',
    'Backend AI「バッキー」',
    'API・DB・セキュリティ担当',
    'ai',
    'backend',
    '/avatars/backend-ai.png'
  ),
  (
    '00000000-0000-4000-8000-000000000102',
    'frontend-ai',
    'Frontend AI「フローネ」',
    'UI・UX・アクセシビリティ担当',
    'ai',
    'frontend',
    '/avatars/frontend-ai.png'
  ),
  (
    '00000000-0000-4000-8000-000000000103',
    'reviewer-ai',
    'Reviewer AI「レビ丸」',
    '品質・リスク・レビュー担当',
    'ai',
    'reviewer',
    '/avatars/reviewer-ai.png'
  ),
  (
    '00000000-0000-4000-8000-000000000104',
    'pm-ai',
    'PM AI「ピーエムさん」',
    '優先順位・スコープ・進行担当',
    'ai',
    'pm',
    '/avatars/pm-ai.png'
  )
on conflict (id) do update set
  handle = excluded.handle,
  display_name = excluded.display_name,
  bio = excluded.bio,
  account_type = excluded.account_type,
  persona_key = excluded.persona_key,
  avatar_path = excluded.avatar_path;
