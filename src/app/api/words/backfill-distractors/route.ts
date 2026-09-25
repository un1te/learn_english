import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { Word } from "@/lib/types";
import { buildDistractors } from "@/lib/external/distractors";

/**
 * POST /api/words/backfill-distractors
 * (Re)generates meaning-based distractors for the current user's words.
 *
 * Body: { mode?: "empty" | "all" }
 *   - "empty" (default): only words without cached distractors.
 *   - "all": regenerate for every word (used to refresh low-quality
 *     options generated earlier).
 * Processes up to 15 words per call to avoid external API rate limits;
 * `remaining` tells the client how many are left for the next click.
 */
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let mode: "empty" | "all" = "empty";
  try {
    const body = (await request.json()) as { mode?: "empty" | "all" };
    if (body?.mode === "all") mode = "all";
  } catch {
    // no body — keep default "empty"
  }

  const { data } = await supabase
    .from("words")
    .select("*")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: true });

  const words = (data ?? []) as Word[];
  const targets =
    mode === "all"
      ? words
      : words.filter(
          (w) =>
            (w.distractors_uk?.length ?? 0) === 0 &&
            (w.distractors_en?.length ?? 0) === 0
        );

  const batch = targets.slice(0, 15);
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
    remaining: Math.max(0, targets.length - batch.length),
  });
}
