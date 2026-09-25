import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { Word } from "@/lib/types";

/**
 * POST /api/quiz/answer
 * Body: { wordId, correct }
 * Updates correct_streak and is_learned via the answer_quiz RPC.
 */
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: { wordId?: string; correct?: boolean };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  if (!body.wordId || typeof body.correct !== "boolean") {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  const { data, error } = await supabase.rpc("answer_quiz", {
    p_word_id: body.wordId,
    p_correct: body.correct,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const word = (Array.isArray(data) ? data[0] : data) as Word | null;
  return NextResponse.json({
    word,
    justLearned: Boolean(word?.is_learned && body.correct),
  });
}
