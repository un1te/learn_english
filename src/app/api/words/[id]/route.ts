import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * PATCH /api/words/:id — update a word of the current user.
 * Body: { is_learned: false }
 *
 * Only UN-learning is allowed here (true → false): the user may remove
 * a word from "learned" to practise it again. Marking a word as learned
 * manually is NOT permitted — that happens only through the quiz
 * (3 correct answers in a row). Any request with is_learned = true is rejected.
 * Removing the flag resets correct_streak so the word restarts its path.
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: { is_learned?: boolean };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  // Only un-learning is allowed. Reject anything other than false.
  if (body.is_learned !== false) {
    return NextResponse.json(
      { error: "manual_learn_not_allowed" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("words")
    .update({ is_learned: false, correct_streak: 0 })
    .eq("id", id)
    .eq("user_id", user.id)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ word: data });
}

/** DELETE /api/words/:id — delete a word of the current user. */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { error } = await supabase
    .from("words")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
