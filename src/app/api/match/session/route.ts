import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { Word } from "@/lib/types";

const PAIRS = 6;

interface MatchCard {
  wordId: string;
  english: string;
  translation: string;
}

/**
 * GET /api/match/session
 * Builds a "match the cards" session: up to 6 words with the lowest
 * "rating" (worst-known first). Returns the pairs; the client shuffles
 * the translation column on screen.
 *
 * Not-learned words are prioritised; if there are fewer than 6, learned
 * words fill the rest so the game always has enough cards when possible.
 */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { data } = await supabase
    .from("words")
    .select("*")
    .eq("user_id", user.id);

  const pool = (data ?? []) as Word[];

  if (pool.length < 2) {
    return NextResponse.json(
      { error: "not_enough_words", need: 2, have: pool.length },
      { status: 422 }
    );
  }

  // Sort by rating: worst-known first (fewer correct, then more wrong).
  const byRating = (a: Word, b: Word) => {
    if (a.correct_count !== b.correct_count)
      return a.correct_count - b.correct_count;
    if (a.wrong_count !== b.wrong_count) return b.wrong_count - a.wrong_count;
    return (
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
  };

  const notLearned = pool.filter((w) => !w.is_learned).sort(byRating);
  const learned = pool.filter((w) => w.is_learned).sort(byRating);
  const ordered = [...notLearned, ...learned];

  const chosen = ordered.slice(0, Math.min(PAIRS, ordered.length));

  const cards: MatchCard[] = chosen.map((w) => ({
    wordId: w.id,
    english: w.english,
    translation: w.translation_uk,
  }));

  return NextResponse.json({ cards });
}
