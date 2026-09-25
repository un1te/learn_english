import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { QuizType, Word } from "@/lib/types";
import { buildQuestion } from "@/lib/quiz";

/**
 * GET /api/quiz?type=en-ua|ua-en
 * Builds a single quiz question. The target word is ONLY a
 * not-yet-learned one (learned words don't appear in the quiz).
 * Options are drawn from the whole dictionary to have 4 distinct answers.
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

  // Target word — only among the NOT-learned ones.
  const notLearned = pool.filter((w) => !w.is_learned);
  if (notLearned.length === 0) {
    return NextResponse.json({ error: "all_learned" }, { status: 422 });
  }

  // Try to assemble a question. Distractors come from the cache
  // (meaning-based); if a random word lacks cache and the dictionary
  // is small, try other not-learned words before giving up.
  for (const target of shuffle(notLearned)) {
    const question = buildQuestion(target, pool, type);
    if (question) {
      return NextResponse.json({ question });
    }
  }

  // No word has enough options (neither cache nor dictionary words).
  return NextResponse.json(
    { error: "not_enough_words", need: 4, have: pool.length },
    { status: 422 }
  );
}

/** Shuffle (Fisher–Yates). */
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
