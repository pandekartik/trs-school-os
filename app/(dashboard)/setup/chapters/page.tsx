import { getRole } from "@/lib/auth";
import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase-server";
import { ChaptersTab } from "@/components/setup/chapters-tab";

export default async function ChaptersPage() {
  const role = await getRole();
  if (role !== "admin") redirect(role === "coordinator" ? "/content" : "/teacher");

  const db = await createServerClient();

  const [
    { data: schoolYears },
    { data: segments },
    { data: standards },
    { data: subjects },
    { data: chapters },
  ] = await Promise.all([
    db.from("school_year").select("*").order("created_at", { ascending: false }),
    db.from("academic_segment").select("*").order("sequence_number"),
    db.from("standard").select("*").order("grade"),
    db.from("subject").select("*").order("name"),
    db.from("chapter").select("*").order("display_order"),
  ]);

  return (
    <ChaptersTab
      chapters={chapters ?? []}
      segments={segments ?? []}
      standards={standards ?? []}
      subjects={subjects ?? []}
      schoolYears={schoolYears ?? []}
    />
  );
}
