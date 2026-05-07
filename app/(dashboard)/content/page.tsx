import { getRole } from "@/lib/auth";
import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase-server";
import { ContentShell } from "@/components/content/content-shell";

export default async function ContentPage() {
  const role = await getRole();
  if (role !== "admin") redirect("/admin");

  const db = createServerClient();

  const [
    { data: schoolYears },
    { data: terms },
    { data: standards },
    { data: subjects },
    { data: units },
    { data: chapters },
    { data: contentPackages },
    { data: teachers },
  ] = await Promise.all([
    db.from("school_year").select("*").eq("is_active", true).limit(1),
    db.from("term").select("*").order("term_number"),
    db.from("standard").select("*").order("grade"),
    db.from("subject").select("*").eq("has_chapters", true).order("name"),
    db.from("unit").select("*").order("unit_number"),
    db.from("chapter").select("*").order("display_order"),
    db.from("content_package").select("*"),
    db.from("teacher").select("id, name").eq("is_active", true),
  ]);

  return (
    <ContentShell
      schoolYear={schoolYears?.[0] ?? null}
      terms={terms ?? []}
      standards={standards ?? []}
      subjects={subjects ?? []}
      units={units ?? []}
      chapters={chapters ?? []}
      contentPackages={contentPackages ?? []}
      teachers={teachers ?? []}
    />
  );
}