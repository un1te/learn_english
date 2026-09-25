import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Quiz from "./Quiz";
import PageHeader from "@/components/PageHeader";

export default async function QuizPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <PageHeader titleKey="quiz.title" />

      <Quiz />
    </main>
  );
}
