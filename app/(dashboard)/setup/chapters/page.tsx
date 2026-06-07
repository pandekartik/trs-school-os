import { getRole } from "@/lib/auth";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase-admin";
import { ChaptersTab } from "@/components/setup/chapters-tab";

export default async function ChaptersPage() {
  const role = await getRole();
  if (!["super_admin", "admin"].includes(role ?? "")) redirect("/admin");

  const admin = createAdminClient();

  const [
    { data: schoolYears },
    { data: segments },
    { data: standards },
    { data: subjects },
    { data: chapters },
  ] = await Promise.all([
    admin.from("school_year").select("*").order("created_at", { ascending: false }),
    admin.from("academic_segment").select("*").order("sequence_number"),
    admin.from("standard").select("*").order("grade"),
    admin.from("subject").select("*").order("name"),
    admin.from("chapter").select("*").order("display_order"),
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
