-- T-005: profiles / posts 初回スキーマ
-- anon/authenticated 向け policy は作らない（service role のみ想定）

create table public.profiles (
  id uuid primary key,
  handle varchar(32) not null,
  display_name varchar(50) not null,
  bio varchar(160) not null,
  account_type varchar(10) not null,
  persona_key varchar(32),
  avatar_path varchar(255) not null,
  created_at timestamptz not null default now(),
  constraint profiles_handle_unique unique (handle),
  constraint profiles_persona_key_unique unique (persona_key),
  constraint profiles_handle_format_check check (
    handle ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'
  ),
  constraint profiles_account_type_check check (
    account_type in ('human', 'ai')
  ),
  constraint profiles_persona_key_consistency_check check (
    (account_type = 'ai' and persona_key is not null)
    or (account_type = 'human' and persona_key is null)
  )
);

create table public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles (id) on delete restrict,
  parent_post_id uuid references public.posts (id) on delete cascade,
  content varchar(300) not null,
  created_at timestamptz not null default now(),
  constraint posts_content_length_check check (
    char_length(btrim(content)) between 1 and 300
  )
);

create index posts_timeline_idx
  on public.posts (created_at desc, id desc)
  where parent_post_id is null;

create index posts_replies_idx
  on public.posts (parent_post_id, created_at asc, id asc)
  where parent_post_id is not null;

alter table public.profiles enable row level security;
alter table public.posts enable row level security;
