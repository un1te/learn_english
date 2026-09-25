import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Word } from "@/lib/types";
import AddWordForm from "./AddWordForm";
import WordList from "./WordList";
import PageHeader from "@/components/PageHeader";

export default async function WordsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data } = await supabase
    .from("words")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const words = (data ?? []) as Word[];

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <PageHeader titleKey="words.title" />

      <div className="mb-6">
        <AddWordForm />
      </div>

      <WordList words={words} />
    </main>
  );
}
