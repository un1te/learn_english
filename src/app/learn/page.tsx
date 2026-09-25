import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Word } from "@/lib/types";
import Flashcards from "./Flashcards";
import PageHeader from "@/components/PageHeader";

export default async function LearnPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Only words that are not learned yet.
  const { data } = await supabase
    .from("words")
    .select("*")
    .eq("user_id", user.id)
    .eq("is_learned", false)
    .order("created_at", { ascending: true });

  const words = (data ?? []) as Word[];

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <PageHeader titleKey="learn.title" />

      <Flashcards words={words} />
    </main>
  );
}
