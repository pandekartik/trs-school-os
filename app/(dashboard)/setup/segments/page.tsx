import { getRole } from "@/lib/auth";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase-admin";
import { SegmentsTab } from "@/components/setup/segments-tab";

export default async function SegmentsPage() {
  const role = await getRole();
  if (!["super_admin", "admin"].includes(role ?? "")) redirect("/admin");

  const admin = createAdminClient();

  const [
    { data: schoolYears },
    { data: segments },
    { data: standards },
  ] = await Promise.all([
    admin.from("school_year").select("*").order("created_at", { ascending: false }),
    admin.from("academic_segment").select("*").order("sequence_number"),
    admin.from("standard").select("*").order("grade"),
  ]);

  return (
    <SegmentsTab
      segments={segments ?? []}
      standards={standards ?? []}
      schoolYears={schoolYears ?? []}
    />
  );
}
