import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

interface TeacherTableProps {
  teachers: any[];
  coverageSummaryThisWeek: any[];
  subjectMap: Map<string, any>;
  periodInstancesThisWeek: any[];
  weekStart: Date;
  chapterMap?: Map<string, any>;
}

export function TeacherTable({
  teachers,
  coverageSummaryThisWeek,
  subjectMap,
  periodInstancesThisWeek,
  weekStart,
  chapterMap,
}: TeacherTableProps) {
  const weekIso = weekStart.toISOString().split("T")[0];

  // Build coverage lookup
  const coverageLookup = new Map(
    coverageSummaryThisWeek.map((c) => [c.teacher_id, c])
  );

  // Get unique subjects per teacher
  const getTeacherSubjects = (teacherId: string): string[] => {
    const teacherPeriods = periodInstancesThisWeek.filter(
      (p) => p.teacher_id === teacherId
    );
    const subjectIds = [...new Set(
      teacherPeriods
        .map((p) => {
          const chapter = chapterMap?.get(p.chapter_id);
          return chapter?.subject_id;
        })
        .filter(Boolean)
    )];
    return subjectIds.map((id) => subjectMap.get(id as string)?.name || "Unknown").filter(Boolean);
  };

  // Sort by coverage percentage (worst first)
  const sortedTeachers = [...teachers].sort((a, b) => {
    const aCoverage = coverageLookup.get(a.id)?.coverage_pct ?? -1;
    const bCoverage = coverageLookup.get(b.id)?.coverage_pct ?? -1;
    return aCoverage - bCoverage;
  });

  const getCoverageColor = (pct: number): string => {
    if (pct >= 80) return "bg-green-100 text-green-700";
    if (pct >= 50) return "bg-amber-100 text-amber-700";
    return "bg-red-100 text-red-700";
  };

  const getCoverageBarColor = (pct: number): string => {
    if (pct >= 80) return "bg-green-500";
    if (pct >= 50) return "bg-amber-500";
    return "bg-red-500";
  };

  return (
    <Card className="p-6">
      <h3 className="font-semibold text-lg mb-4">Teacher Performance — This Week</h3>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="text-left py-3 px-3 font-semibold">Teacher</th>
              <th className="text-left py-3 px-3 font-semibold">Subjects</th>
              <th className="text-center py-3 px-3 font-semibold">Scheduled</th>
              <th className="text-center py-3 px-3 font-semibold">Done</th>
              <th className="text-center py-3 px-3 font-semibold">Partial</th>
              <th className="text-center py-3 px-3 font-semibold">Unlogged</th>
              <th className="text-left py-3 px-3 font-semibold">Coverage</th>
              <th className="text-center py-3 px-3 font-semibold">Action</th>
            </tr>
          </thead>
          <tbody>
            {sortedTeachers.map((teacher) => {
              const coverage = coverageLookup.get(teacher.id);
              const scheduled = coverage?.total_scheduled ?? 0;
              const done = coverage?.total_done ?? 0;
              const partial = coverage?.total_partial ?? 0;
              const unlogged = coverage?.total_unlogged ?? 0;
              const coveragePct = coverage?.coverage_pct ?? 0;
              const subjects = getTeacherSubjects(teacher.id);

              return (
                <tr key={teacher.id} className="border-b hover:bg-muted/50">
                  <td className="py-3 px-3">
                    <div className="font-medium">{teacher.name}</div>
                    {teacher.role && (
                      <Badge variant="secondary" className="text-xs mt-1">
                        {teacher.role}
                      </Badge>
                    )}
                  </td>
                  <td className="py-3 px-3 text-muted-foreground">
                    {subjects.length > 0 ? subjects.join(", ") : "—"}
                  </td>
                  <td className="py-3 px-3 text-center">{scheduled}</td>
                  <td className="py-3 px-3 text-center">{done}</td>
                  <td className="py-3 px-3 text-center">{partial}</td>
                  <td className="py-3 px-3 text-center">
                    {unlogged > 0 && <span className="text-red-600 font-semibold">{unlogged}</span>}
                    {unlogged === 0 && <span className="text-muted-foreground">0</span>}
                  </td>
                  <td className="py-3 px-3">
                    <div className="space-y-1">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all ${getCoverageBarColor(coveragePct)}`}
                          style={{ width: `${Math.min(coveragePct, 100)}%` }}
                        />
                      </div>
                      <div className={`text-xs font-semibold px-2 py-1 rounded w-fit ${getCoverageColor(coveragePct)}`}>
                        {coveragePct.toFixed(1)}%
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-center">
                    <Link href={`/teacher?teacher=${teacher.id}&week=${weekIso}`}>
                      <Button variant="ghost" size="sm">
                        View
                      </Button>
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
