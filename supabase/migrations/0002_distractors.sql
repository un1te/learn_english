-- ============================================================
-- Cache of distractors (wrong options) for the quiz.
-- Generated from the internet when a word is added:
--   distractors_uk — meaning-based UKRAINIAN translations (for EN→UA)
--   distractors_en — meaning-based ENGLISH words          (for UA→EN)
-- Stored as text arrays.
-- ============================================================
alter table public.words
  add column if not exists distractors_uk text[] not null default '{}',
  add column if not exists distractors_en text[] not null default '{}';
