import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import DashboardContent from "./DashboardContent";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", user.id)
    .single();

  const { count: total } = await supabase
    .from("words")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id);

  const { count: learned } = await supabase
    .from("words")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("is_learned", true);

  const totalCount = total ?? 0;
  const learnedCount = learned ?? 0;

  return (
    <DashboardContent
      username={profile?.username ?? "friend"}
      totalCount={totalCount}
      learnedCount={learnedCount}
      toLearn={totalCount - learnedCount}
    />
  );
}
