import { getRole, getActiveBranch } from "@/lib/auth";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase-admin";
import { ChaptersTab } from "@/components/setup/chapters-tab";

export default async function ChaptersPage() {
  const role = await getRole();
  if (!["super_admin", "admin"].includes(role ?? "")) redirect("/admin");

  const admin = createAdminClient();
  const activeBranch = await getActiveBranch();

  // Standards/segments/school years are branch-scoped; subjects and
  // chapters (content) are shared across branches.
  let schoolYearsQuery = admin.from("school_year").select("*").order("created_at", { ascending: false });
  let segmentsQuery = admin.from("academic_segment").select("*").order("sequence_number");
  let standardsQuery = admin.from("standard").select("*").order("grade");
  if (activeBranch) {
    schoolYearsQuery = schoolYearsQuery.eq("branch_id", activeBranch.id);
    segmentsQuery = segmentsQuery.eq("branch_id", activeBranch.id);
    standardsQuery = standardsQuery.eq("branch_id", activeBranch.id);
  }

  const [
    { data: schoolYears },
    { data: segments },
    { data: standards },
    { data: subjects },
    { data: chapters },
  ] = await Promise.all([
    schoolYearsQuery,
    segmentsQuery,
    standardsQuery,
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
