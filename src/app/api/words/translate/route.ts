import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { translateToUk } from "@/lib/external/translate";

/**
 * GET /api/words/translate?word=...
 * Auto-translates an English word to Ukrainian (used to prefill the
 * translation field when the English input loses focus).
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
  const word = searchParams.get("word") ?? "";
  const translation = await translateToUk(word, false);
  return NextResponse.json({ translation });
}
