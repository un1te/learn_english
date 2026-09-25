import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { QuizQuestion, QuizType, Word } from "@/lib/types";
import { buildQuestion } from "@/lib/quiz";

const SESSION_SIZE = 10;

/**
 * GET /api/quiz/session?type=en-ua|ua-en
 * Builds a quiz session of up to 10 questions.
 *
 * Target words are NOT-learned ones ordered by "rating" (worst-known
 * first: fewer correct, then more wrong answers). Options come from the
 * cached meaning-based distractors, with a dictionary fallback.
 */
export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const requestedType = searchParams.get("type") as QuizType | null;
  const type: QuizType = requestedType === "ua-en" ? "ua-en" : "en-ua";

  const { data } = await supabase
    .from("words")
    .select("*")
    .eq("user_id", user.id);

  const pool = (data ?? []) as Word[];

  if (pool.length === 0) {
    return NextResponse.json(
      { error: "not_enough_words", need: 1, have: 0 },
      { status: 422 }
    );
  }

  // Not-learned words, worst-known first.
  const notLearned = pool
    .filter((w) => !w.is_learned)
    .sort((a, b) => {
      if (a.correct_count !== b.correct_count)
        return a.correct_count - b.correct_count;
      if (a.wrong_count !== b.wrong_count)
        return b.wrong_count - a.wrong_count;
      return (
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
    });

  if (notLearned.length === 0) {
    return NextResponse.json({ error: "all_learned" }, { status: 422 });
  }

  // Take up to 10 worst-known words and build a question for each.
  const targets = notLearned.slice(0, SESSION_SIZE);
  const questions: QuizQuestion[] = [];
  for (const target of targets) {
    const q = buildQuestion(target, pool, type);
    if (q) questions.push(q);
  }

  if (questions.length === 0) {
    return NextResponse.json(
      { error: "not_enough_words", need: 4, have: pool.length },
      { status: 422 }
    );
  }

  return NextResponse.json({ questions });
}
