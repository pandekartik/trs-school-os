import { getRole } from "@/lib/auth";
import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase-server";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SchoolYearTab } from "@/components/setup/school-year-tab";
import { StandardsTab } from "@/components/setup/standards-tab";
import { SubjectsTab } from "@/components/setup/subjects-tab";
import { TeachersTab } from "@/components/setup/teachers-tab";
import { SegmentsTab } from "@/components/setup/segments-tab";
import { AssignmentsTab } from "@/components/setup/assignments-tab";

export default async function SetupPage() {
  const role = await getRole();
  if (role !== "admin") redirect("/admin");

  const db = await createServerClient();

  const [
    { data: schoolYears },
    { data: segments },
    { data: standards },
    { data: divisions },
    { data: subjects },
    { data: teachers },
    { data: assignments },
  ] = await Promise.all([
    db.from("school_year").select("*").order("created_at", { ascending: false }),
    db.from("academic_segment").select("*").order("sequence_number"),
    db.from("standard").select("*").order("grade"),
    db.from("division").select("*").order("name"),
    db.from("subject").select("*").order("name"),
    db.from("teacher").select("*").order("name"),
    db.from("teacher_assignment").select("*"),
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
        <TabsList>
          <TabsTrigger value="school-year">School Year</TabsTrigger>
          <TabsTrigger value="segments">Segments</TabsTrigger>
          <TabsTrigger value="standards">Standards & Divisions</TabsTrigger>
          <TabsTrigger value="subjects">Subjects</TabsTrigger>
          <TabsTrigger value="teachers">Teachers</TabsTrigger>
          <TabsTrigger value="assignments">Assignments</TabsTrigger>
        </TabsList>

        <TabsContent value="school-year" className="mt-6">
          <SchoolYearTab schoolYears={schoolYears ?? []} />
        </TabsContent>

        <TabsContent value="segments" className="mt-6">
          <SegmentsTab
            segments={segments ?? []}
            standards={standards ?? []}
            schoolYears={schoolYears ?? []}
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

        <TabsContent value="assignments" className="mt-6">
          <AssignmentsTab
            teachers={teachers ?? []}
            subjects={subjects ?? []}
            divisions={divisions ?? []}
            standards={standards ?? []}
            schoolYears={schoolYears ?? []}
            assignments={assignments ?? []}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
