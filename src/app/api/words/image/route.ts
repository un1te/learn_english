import { NextResponse } from "next/server";
import { findImage } from "@/lib/external/image";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const word = searchParams.get("word") ?? "";
  const imageUrl = await findImage(word);
  return NextResponse.json({ imageUrl });
}
