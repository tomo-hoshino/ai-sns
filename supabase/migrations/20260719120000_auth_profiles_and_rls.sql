-- T-110: Supabase Auth ↔ profiles 連携と RLS 初期 policy
--
-- 設計要約:
-- - Auth で作成された人間は profiles.id = auth.users.id（同 UUID）
-- - AI とレガシー @you は auth.users 行を持たないため、profiles → auth.users の FK は付けない
-- - repository は当面 service role 継続（AI 返信 insert が Auth ユーザーでないため）。service role は RLS を bypass する
-- - 本 policy は anon key 漏洩時の防御と、将来の user-scoped client 用

-- ---------------------------------------------------------------------------
-- Auth signup → human profile
-- ---------------------------------------------------------------------------

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  email_local text;
  meta_display_name text;
  base_handle text;
  candidate_handle text;
  display_name_value text;
  suffix integer := 0;
begin
  email_local := split_part(coalesce(new.email, ''), '@', 1);
  meta_display_name := nullif(btrim(coalesce(new.raw_user_meta_data ->> 'display_name', '')), '');

  base_handle := lower(regexp_replace(email_local, '[^a-z0-9]+', '-', 'g'));
  base_handle := trim(both '-' from base_handle);

  if base_handle = '' or char_length(base_handle) > 24 then
    base_handle := 'user';
  end if;

  candidate_handle := base_handle;

  while exists (
    select 1 from public.profiles where handle = candidate_handle
  ) loop
    suffix := suffix + 1;
    candidate_handle := base_handle || '-' || suffix::text;

    if char_length(candidate_handle) > 32 then
      candidate_handle := left(base_handle, greatest(1, 32 - 1 - char_length(suffix::text)))
        || '-' || suffix::text;
    end if;
  end loop;

  display_name_value := coalesce(
    meta_display_name,
    nullif(btrim(email_local), ''),
    'ユーザー'
  );

  if char_length(display_name_value) > 50 then
    display_name_value := left(display_name_value, 50);
  end if;

  insert into public.profiles (
    id,
    handle,
    display_name,
    bio,
    account_type,
    persona_key,
    avatar_path
  )
  values (
    new.id,
    candidate_handle,
    display_name_value,
    'AI社員と一緒に働く人',
    'human',
    null,
    '/avatars/you.png'
  );

  return new;
end;
$$;

revoke all on function public.handle_new_auth_user() from public;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_auth_user();

-- ---------------------------------------------------------------------------
-- RLS policies（公開読取 + 自分のルート投稿 insert）
-- ---------------------------------------------------------------------------

drop policy if exists profiles_select_public on public.profiles;
create policy profiles_select_public
  on public.profiles
  for select
  to anon, authenticated
  using (true);

drop policy if exists posts_select_public on public.posts;
create policy posts_select_public
  on public.posts
  for select
  to anon, authenticated
  using (true);

drop policy if exists posts_insert_own_root on public.posts;
create policy posts_insert_own_root
  on public.posts
  for insert
  to authenticated
  with check (
    author_id = (select auth.uid())
    and parent_post_id is null
  );

-- UPDATE / DELETE policy は作らない（投稿編集・削除・プロフィール編集は対象外）
-- AI 返信の insert は service role（RLS bypass）経由のみ
