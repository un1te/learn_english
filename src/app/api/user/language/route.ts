import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { Language } from "@/lib/types";

/** PUT /api/user/language  Body: { language: 'uk' | 'en' } */
export async function PUT(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: { language?: Language };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  if (body.language !== "uk" && body.language !== "en") {
    return NextResponse.json({ error: "bad_language" }, { status: 400 });
  }

  const { error } = await supabase
    .from("profiles")
    .update({ preferred_language: body.language })
    .eq("id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true, language: body.language });
}
