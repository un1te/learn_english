import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { spellcheckEnglish } from "@/lib/external/dictionary";
import { findImage } from "@/lib/external/image";
import { buildDistractors } from "@/lib/external/distractors";

/** GET /api/words — all words of the current user. */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("words")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ words: data });
}

/**
 * POST /api/words — add a word.
 * Body: { english, translation_uk, category?, force? }
 * If spelling is doubtful and force !== true — returns 422 with suggestions.
 */
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: {
    english?: string;
    translation_uk?: string;
    category?: string;
    force?: boolean;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  const english = (body.english ?? "").trim();
  const translationUk = (body.translation_uk ?? "").trim();
  const category = (body.category ?? "").trim() || null;

  if (!english || !translationUk) {
    return NextResponse.json(
      { error: "Вкажіть слово та переклад" },
      { status: 400 }
    );
  }

  // Spellcheck — block only if the user hasn't confirmed (force).
  if (!body.force) {
    const check = await spellcheckEnglish(english);
    if (!check.ok) {
      return NextResponse.json(
        {
          error: "spellcheck",
          message: "Можливо, у слові помилка",
          suggestions: check.suggestions,
        },
        { status: 422 }
      );
    }
  }

  // In parallel: association image + distractors (meaning-based options
  // for the quiz). Both are non-critical — on failure we leave them empty.
  const [imageUrl, distractors] = await Promise.all([
    findImage(english),
    buildDistractors(english, translationUk),
  ]);

  const { data, error } = await supabase
    .from("words")
    .insert({
      user_id: user.id,
      english,
      translation_uk: translationUk,
      category,
      image_url: imageUrl,
      distractors_en: distractors.en,
      distractors_uk: distractors.uk,
    })
    .select("*")
    .single();

  if (error) {
    // 23505 — unique violation (word already in the dictionary)
    if ((error as { code?: string }).code === "23505") {
      return NextResponse.json(
        { error: "Це слово вже є у вашому словнику" },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ word: data }, { status: 201 });
}
