import { getRole } from "@/lib/auth";
import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase-server";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SchoolYearTab } from "@/components/setup/school-year-tab";
import { StandardsTab } from "@/components/setup/standards-tab";
import { SubjectsTab } from "@/components/setup/subjects-tab";
import { TeachersTab } from "@/components/setup/teachers-tab";

export default async function SetupPage() {
  const role = await getRole();
  if (role !== "admin") redirect("/admin");

  const db = createServerClient();

  const [
    { data: schoolYears },
    { data: terms },
    { data: standards },
    { data: divisions },
    { data: subjects },
    { data: teachers },
  ] = await Promise.all([
    db.from("school_year").select("*").order("created_at", { ascending: false }),
    db.from("term").select("*").order("term_number"),
    db.from("standard").select("*").order("grade"),
    db.from("division").select("*").order("name"),
    db.from("subject").select("*").order("name"),
    db.from("teacher").select("*").order("name"),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1>Academic Setup</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Configure the academic structure for TRS. Complete each tab in order.
        </p>
      </div>

      <Tabs defaultValue="school-year">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="school-year">School Year & Terms</TabsTrigger>
          <TabsTrigger value="standards">Standards & Divisions</TabsTrigger>
          <TabsTrigger value="subjects">Subjects</TabsTrigger>
          <TabsTrigger value="teachers">Teachers</TabsTrigger>
        </TabsList>

        <TabsContent value="school-year" className="mt-6">
          <SchoolYearTab
            schoolYears={schoolYears ?? []}
            terms={terms ?? []}
          />
        </TabsContent>

        <TabsContent value="standards" className="mt-6">
          <StandardsTab
            standards={standards ?? []}
            divisions={divisions ?? []}
          />
        </TabsContent>

        <TabsContent value="subjects" className="mt-6">
          <SubjectsTab
            subjects={subjects ?? []}
            standards={standards ?? []}
          />
        </TabsContent>

        <TabsContent value="teachers" className="mt-6">
          <TeachersTab teachers={teachers ?? []} />
        </TabsContent>
      </Tabs>
    </div>
  );
}