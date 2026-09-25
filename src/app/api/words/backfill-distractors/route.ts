import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { Word } from "@/lib/types";
import { buildDistractors } from "@/lib/external/distractors";

/**
 * POST /api/words/backfill-distractors
 * Backfills distractors for the current user's words whose cache is
 * still empty (added before this feature existed). Processes up to 15
 * words per call to avoid hitting external API rate limits.
 */
export async function POST() {
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

  const words = (data ?? []) as Word[];
  const needBackfill = words.filter(
    (w) =>
      (w.distractors_uk?.length ?? 0) === 0 &&
      (w.distractors_en?.length ?? 0) === 0
  );

  const batch = needBackfill.slice(0, 15);
  let updated = 0;

  for (const w of batch) {
    const d = await buildDistractors(w.english, w.translation_uk);
    if (d.en.length === 0 && d.uk.length === 0) continue;
    const { error } = await supabase
      .from("words")
      .update({ distractors_en: d.en, distractors_uk: d.uk })
      .eq("id", w.id)
      .eq("user_id", user.id);
    if (!error) updated++;
  }

  return NextResponse.json({
    updated,
    remaining: Math.max(0, needBackfill.length - batch.length),
  });
}
