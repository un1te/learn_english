import { NextResponse } from "next/server";
import { spellcheckEnglish } from "@/lib/external/dictionary";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const word = searchParams.get("word") ?? "";
  const result = await spellcheckEnglish(word);
  return NextResponse.json(result);
}
