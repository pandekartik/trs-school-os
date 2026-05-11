"use client";

import { SchoolYear } from "@/lib/types";
import {
  createSchoolYear, updateSchoolYear,
  deleteSchoolYear, setActiveSchoolYear,
} from "@/lib/actions/setup";
import { useAction } from "@/lib/hooks/use-action";
import { EditableRow } from "@/components/shared/editable-row";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Plus, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { useRef } from "react";

function EditYearForm({ year, onDone }: { year: SchoolYear; onDone: () => void }) {
  const action = useAction(
    (fd) => updateSchoolYear(year.id, fd),
    { successMessage: "Updated", onSuccess: onDone }
  );
  return (
    <form ref={action.formRef} action={action.execute} className="flex flex-col gap-2">
      <div className="grid grid-cols-3 gap-2">
        <div className="flex flex-col gap-1">
          <Label>Name</Label>
          <Input name="name" defaultValue={year.name} className="h-7 text-xs" required />
        </div>
        <div className="flex flex-col gap-1">
          <Label>Start</Label>
          <Input name="start_date" type="date" defaultValue={year.start_date} className="h-7 text-xs" required />
        </div>
        <div className="flex flex-col gap-1">
          <Label>End</Label>
          <Input name="end_date" type="date" defaultValue={year.end_date} className="h-7 text-xs" required />
        </div>
      </div>
      <Button type="submit" size="sm" className="h-7 text-xs w-fit" disabled={action.loading}>
        {action.loading ? <Loader2 className="h-3 w-3 animate-spin" /> : "Save changes"}
      </Button>
    </form>
  );
}

export function SchoolYearTab({ schoolYears }: { schoolYears: SchoolYear[] }) {
  const syAction = useAction(createSchoolYear, { successMessage: "School year created" });

  async function handleDelete(id: string) {
    const result = await deleteSchoolYear(id);
    if (result?.error) toast.error("Delete failed", { description: result.error });
    else toast.success("Deleted");
  }

  return (
    <div className="grid grid-cols-2 gap-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>School years</CardTitle>
            {schoolYears.length > 0 && (
              <Badge variant="outline" className="font-normal">{schoolYears.length} years</Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <form ref={syAction.formRef} action={syAction.execute} className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <Label>Name</Label>
              <Input name="name" placeholder="e.g. 2026-27" required />
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              <div className="flex flex-col gap-1.5">
                <Label>Start date</Label>
                <Input name="start_date" type="date" required />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>End date</Label>
                <Input name="end_date" type="date" required />
              </div>
            </div>
            <Button type="submit" disabled={syAction.loading} className="w-full">
              {syAction.loading
                ? <><Loader2 className="h-3.5 w-3.5 animate-spin" />Adding...</>
                : <><Plus className="h-3.5 w-3.5" />Add school year</>
              }
            </Button>
          </form>

          {schoolYears.length > 0 && (
            <>
              <div className="h-px bg-border my-4" />
              <div className="flex flex-col gap-1.5">
                {schoolYears.map((year) => (
                  <EditableRow
                    key={year.id}
                    editForm={<EditYearForm year={year} onDone={() => {}} />}
                    onDelete={() => handleDelete(year.id)}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium">{year.name}</span>
                      {year.is_active
                        ? <Badge className="text-[10px] h-5 px-2">Active</Badge>
                        : (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-5 w-5 hover:text-green-700"
                            onClick={async () => {
                              await setActiveSchoolYear(year.id);
                              toast.success("Active year updated");
                            }}
                          >
                            <CheckCircle className="h-3 w-3" />
                          </Button>
                        )
                      }
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      {year.start_date} → {year.end_date}
                    </div>
                  </EditableRow>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>How it works</CardTitle></CardHeader>
        <CardContent>
          <div className="flex flex-col gap-3 text-sm text-muted-foreground">
            <p>Only one year is active at a time. Past years are archived — viewable but not editable.</p>
            <div className="rounded-lg border bg-secondary/40 p-3 text-xs">
              <p className="font-medium text-foreground mb-1.5">Complete setup in this order</p>
              <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                <li>School year <span className="text-green-600">← you are here</span></li>
                <li>Standards & divisions</li>
                <li>Segments per standard</li>
                <li>Subjects per standard</li>
                <li>Teachers</li>
                <li>Assignments</li>
              </ol>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}