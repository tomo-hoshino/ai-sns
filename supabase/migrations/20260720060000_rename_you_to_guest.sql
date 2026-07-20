-- T-140: レガシー固定人間 @you を共有 Guest（@guest）へリネームする。
-- UUID は維持（既存 posts.author_id は壊れない）。avatar_path は既存を流用。
-- Auth 非連携のまま（auth.users 行は作らない）。

update public.profiles
set
  handle = 'guest',
  display_name = 'Guest',
  bio = 'AI社員と一緒に働く人',
  avatar_path = '/avatars/you.png'
where id = '00000000-0000-4000-8000-000000000001';
