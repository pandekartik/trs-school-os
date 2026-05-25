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
import { Loader2, Plus, Calendar } from "lucide-react";
import { toast } from "sonner";

function EditYearForm({ year, onDone }: { year: SchoolYear; onDone: () => void }) {
  const action = useAction(
    (fd) => updateSchoolYear(year.id, fd),
    { successMessage: "Updated", onSuccess: onDone }
  );
  return (
    <form onSubmit={action.handleSubmit} className="flex flex-col gap-2">
      <div className="grid grid-cols-3 gap-2">
        <div className="flex flex-col gap-1">
          <Label>Name</Label>
          <Input name="name" defaultValue={year.name} className="h-8 text-xs" required />
        </div>
        <div className="flex flex-col gap-1">
          <Label>Start</Label>
          <Input name="start_date" type="date" defaultValue={year.start_date} className="h-8 text-xs" required />
        </div>
        <div className="flex flex-col gap-1">
          <Label>End</Label>
          <Input name="end_date" type="date" defaultValue={year.end_date} className="h-8 text-xs" required />
        </div>
      </div>
      <div className="flex gap-2">
        <Button type="submit" size="sm" className="h-8 text-xs" disabled={action.loading}>
          {action.loading ? <Loader2 className="h-3 w-3 animate-spin" /> : "Save"}
        </Button>
        <Button type="button" variant="ghost" size="sm" className="h-8 text-xs" onClick={onDone}>
          Cancel
        </Button>
      </div>
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
    <Card className="border-2xl">
      <CardHeader>
        <CardTitle>School Year</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        {/* Add Form - Inline Row */}
        <form onSubmit={syAction.handleSubmit} className="flex items-end gap-2">
          <div className="flex-1">
            <Label className="text-xs mb-1.5 block">Name</Label>
            <Input
              name="name"
              placeholder="e.g. 2026-27"
              className="h-8 text-xs"
              required
            />
          </div>
          <div className="flex-1">
            <Label className="text-xs mb-1.5 block">Start date</Label>
            <Input
              name="start_date"
              type="date"
              className="h-8 text-xs"
              required
            />
          </div>
          <div className="flex-1">
            <Label className="text-xs mb-1.5 block">End date</Label>
            <Input
              name="end_date"
              type="date"
              className="h-8 text-xs"
              required
            />
          </div>
          <Button
            type="submit"
            size="sm"
            disabled={syAction.loading}
            className="h-8 text-xs"
          >
            {syAction.loading
              ? <><Loader2 className="h-3 w-3 animate-spin" /></>
              : <><Plus className="h-3.5 w-3.5" /></>
            }
            Add
          </Button>
        </form>

        {schoolYears.length > 0 && (
          <>
            <div className="h-px bg-gray-200" />

            {/* Table */}
            <div className="flex flex-col gap-0 border border-gray-200 rounded-sm overflow-hidden">
              {/* Header */}
              <div className="grid grid-cols-5 gap-4 px-3 py-2 bg-gray-50 border-b border-gray-200 text-xs font-semibold uppercase text-gray-600">
                <div>Name</div>
                <div>Date Range</div>
                <div>Status</div>
                <div>Action</div>
                <div></div>
              </div>

              {/* Rows */}
              {schoolYears.map((year) => (
                <EditableRow
                  key={year.id}
                  editForm={<EditYearForm year={year} onDone={() => {}} />}
                  onDelete={() => handleDelete(year.id)}
                  className="border-b border-gray-100 last:border-b-0 bg-white px-0 py-0 rounded-none"
                >
                  <div className="grid grid-cols-5 gap-4 px-3 py-2.5 items-center w-full">
                    <div className="text-xs font-medium text-gray-900">{year.name}</div>
                    <div className="text-xs text-gray-500">
                      {year.start_date} → {year.end_date}
                    </div>
                    <div>
                      {year.is_active && (
                        <Badge className="text-[10px] h-5 px-2 bg-green-100 text-green-700 border-0">Active</Badge>
                      )}
                    </div>
                    <div>
                      {!year.is_active && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 text-xs text-gray-600 px-2"
                          onClick={async () => {
                            await setActiveSchoolYear(year.id);
                            toast.success("Active year updated");
                          }}
                        >
                          Set Active
                        </Button>
                      )}
                    </div>
                  </div>
                </EditableRow>
              ))}
            </div>
          </>
        )}

        {schoolYears.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <Calendar className="h-12 w-12 text-gray-300" />
            <div className="text-center">
              <p className="text-sm font-medium text-gray-600">No school years yet</p>
              <p className="text-xs text-gray-500">Add your first school year above</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
