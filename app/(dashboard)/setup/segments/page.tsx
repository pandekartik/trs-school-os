import { getRole, getActiveBranch } from "@/lib/auth";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase-admin";
import { SegmentsTab } from "@/components/setup/segments-tab";

export default async function SegmentsPage() {
  const role = await getRole();
  if (!["super_admin", "admin"].includes(role ?? "")) redirect("/admin");

  const admin = createAdminClient();
  const activeBranch = await getActiveBranch();

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
  ] = await Promise.all([schoolYearsQuery, segmentsQuery, standardsQuery]);

  return (
    <SegmentsTab
      segments={segments ?? []}
      standards={standards ?? []}
      schoolYears={schoolYears ?? []}
    />
  );
}
