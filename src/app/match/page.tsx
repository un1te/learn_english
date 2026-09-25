import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import MatchGame from "./MatchGame";
import PageHeader from "@/components/PageHeader";

export default async function MatchPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <PageHeader titleKey="match.title" />
      <MatchGame />
    </main>
  );
}
