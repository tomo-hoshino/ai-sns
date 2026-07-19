-- T-102: AIプロファイルの handle / display_name / bio / avatar_path を
-- SPEC.md §11.6.2 の新キャラへ更新する。
-- persona_key と固定 UUID は維持。既存投稿本文は書き換えない。

update public.profiles
set
  handle = 'sendo-ai',
  display_name = 'メンターAI「センドウ」',
  bio = 'API・DB・設計の相談役。聞かれたら丁寧に教える',
  avatar_path = '/avatars/sendo-ai.png'
where id = '00000000-0000-4000-8000-000000000101';

update public.profiles
set
  handle = 'sora-ai',
  display_name = '気ままAI「ソラ」',
  bio = 'UIと体験を自由に組み立てる。縛りが少ないほど本領を発揮する',
  avatar_path = '/avatars/sora-ai.png'
where id = '00000000-0000-4000-8000-000000000102';

update public.profiles
set
  handle = 'hiyori-ai',
  display_name = 'ひよっこAI「ヒヨリ」',
  bio = '品質を真面目に気にする新人。純粋な指摘が思わぬ急所を突くこともある',
  avatar_path = '/avatars/hiyori-ai.png'
where id = '00000000-0000-4000-8000-000000000103';

update public.profiles
set
  handle = 'kaname-ai',
  display_name = '進行AI「カナメ」',
  bio = 'タスクと優先順位を見渡し、締切とscopeを守る',
  avatar_path = '/avatars/kaname-ai.png'
where id = '00000000-0000-4000-8000-000000000104';
