import { getRole } from "@/lib/auth";
import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase-server";
import { SegmentsTab } from "@/components/setup/segments-tab";

export default async function SegmentsPage() {
  const role = await getRole();
  if (!["super_admin", "admin"].includes(role ?? "")) redirect("/admin");

  const db = await createServerClient();

  const [
    { data: schoolYears },
    { data: segments },
    { data: standards },
  ] = await Promise.all([
    db.from("school_year").select("id, display_id, name, start_date, end_date, is_active, created_at").order("created_at", { ascending: false }),
    db.from("academic_segment").select("id, display_id, school_year_id, standard_id, name, segment_type, sequence_number, start_date, end_date, created_at").order("sequence_number"),
    db.from("standard").select("id, display_id, name, grade").order("grade"),
  ]);

  return (
    <SegmentsTab
      segments={segments ?? []}
      standards={standards ?? []}
      schoolYears={schoolYears ?? []}
    />
  );
}
