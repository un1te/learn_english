-- ============================================================
-- English Words App — initial schema
-- Run in Supabase → SQL Editor (or via the supabase CLI)
-- ============================================================

-- ---------- profiles ----------
-- User profile (1:1 with auth.users).
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null unique,
  preferred_language text not null default 'uk'
    check (preferred_language in ('uk', 'en')),
  created_at timestamptz not null default now()
);

-- ---------- words ----------
-- Personal dictionary bound to a user.
create table if not exists public.words (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  english text not null,
  translation_uk text not null,
  category text,
  image_url text,
  is_learned boolean not null default false,
  correct_streak integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists words_user_id_idx on public.words (user_id);
create index if not exists words_user_learned_idx on public.words (user_id, is_learned);

-- Uniqueness of a word within one user's dictionary (case-insensitive).
create unique index if not exists words_user_english_uidx
  on public.words (user_id, lower(english));

-- ---------- updated_at trigger ----------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists words_set_updated_at on public.words;
create trigger words_set_updated_at
  before update on public.words
  for each row execute function public.set_updated_at();

-- ============================================================
-- Row Level Security
-- ============================================================
alter table public.profiles enable row level security;
alter table public.words enable row level security;

-- profiles: a user can view/edit only their own profile.
drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own on public.profiles
  for select using (auth.uid() = id);

drop policy if exists profiles_insert_own on public.profiles;
create policy profiles_insert_own on public.profiles
  for insert with check (auth.uid() = id);

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles
  for update using (auth.uid() = id);

-- words: full CRUD only over own words.
drop policy if exists words_select_own on public.words;
create policy words_select_own on public.words
  for select using (auth.uid() = user_id);

drop policy if exists words_insert_own on public.words;
create policy words_insert_own on public.words
  for insert with check (auth.uid() = user_id);

drop policy if exists words_update_own on public.words;
create policy words_update_own on public.words
  for update using (auth.uid() = user_id);

drop policy if exists words_delete_own on public.words;
create policy words_delete_own on public.words
  for delete using (auth.uid() = user_id);

-- ============================================================
-- RPC: record a quiz answer (streak → learned)
-- Runs on behalf of the user, modifies only their own word.
-- ============================================================
create or replace function public.answer_quiz(p_word_id uuid, p_correct boolean)
returns public.words
language plpgsql
security invoker
as $$
declare
  updated public.words;
begin
  update public.words
     set correct_streak = case when p_correct then correct_streak + 1 else 0 end,
         is_learned = case when p_correct and correct_streak + 1 >= 3 then true else is_learned end
   where id = p_word_id
     and user_id = auth.uid()
  returning * into updated;

  return updated;
end;
$$;

-- ============================================================
-- RPC: random "forgetting" — clears is_learned from <= 10% of the
-- user's learned words (at least 1, if there are any learned words).
-- ============================================================
create or replace function public.forget_random(p_max_share numeric default 0.10)
returns setof public.words
language plpgsql
security invoker
as $$
declare
  learned_count integer;
  to_forget integer;
begin
  select count(*) into learned_count
    from public.words
   where user_id = auth.uid() and is_learned = true;

  if learned_count = 0 then
    return;
  end if;

  to_forget := greatest(1, floor(learned_count * p_max_share)::int);

  return query
  update public.words
     set is_learned = false,
         correct_streak = 0
   where id in (
     select id from public.words
      where user_id = auth.uid() and is_learned = true
      order by random()
      limit to_forget
   )
  returning *;
end;
$$;

-- ============================================================
-- GRANTS
-- RLS restricts access at the row level, but roles still need basic
-- privileges on tables/functions, otherwise Postgres rejects the query
-- with "permission denied for table". Supabase does not always grant
-- them automatically for tables created via the SQL Editor.
-- ============================================================
grant usage on schema public to anon, authenticated;

grant select, insert, update, delete on public.words to anon, authenticated;
grant select, insert, update, delete on public.profiles to anon, authenticated;

grant execute on function public.answer_quiz(uuid, boolean) to anon, authenticated;
grant execute on function public.forget_random(numeric) to anon, authenticated;

-- ============================================================
-- Auto-create a profile when a user registers.
-- More reliable than inserting the profile from application code:
-- guarantees that every auth.users has a row in public.profiles, so
-- the foreign key words.user_id -> profiles.id is never violated.
-- ============================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, username)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Safety net for already-existing users without a profile.
insert into public.profiles (id, username)
select
  u.id,
  coalesce(u.raw_user_meta_data->>'username', split_part(u.email, '@', 1))
from auth.users u
left join public.profiles p on p.id = u.id
where p.id is null;
