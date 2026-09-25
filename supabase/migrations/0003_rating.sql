-- ============================================================
-- Answer counters for word "rating".
-- Rating = how well a word is known. Lower rating means the word
-- was answered correctly less often, so it should be practised first.
--   correct_count — cumulative number of correct quiz answers
--   wrong_count   — cumulative number of wrong quiz answers
-- Unlike correct_streak (which resets on a mistake), these accumulate
-- over the whole history and drive word ordering in Learn/Quiz.
-- ============================================================
alter table public.words
  add column if not exists correct_count integer not null default 0,
  add column if not exists wrong_count integer not null default 0;

-- Order words by "rating": worst first.
-- Fewer correct answers and more wrong answers => practise earlier.
create index if not exists words_user_rating_idx
  on public.words (user_id, correct_count, wrong_count);

-- ============================================================
-- Updated RPC: record a quiz answer.
-- Besides streak/is_learned, it now also maintains the cumulative
-- correct_count / wrong_count counters used for rating.
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
         is_learned = case when p_correct and correct_streak + 1 >= 3 then true else is_learned end,
         correct_count = correct_count + case when p_correct then 1 else 0 end,
         wrong_count = wrong_count + case when p_correct then 0 else 1 end
   where id = p_word_id
     and user_id = auth.uid()
  returning * into updated;

  return updated;
end;
$$;
