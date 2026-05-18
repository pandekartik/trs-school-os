"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { Holiday } from "@/lib/types";
import { createHoliday, deleteHoliday, updateHoliday } from "@/lib/actions/timetable";
import { useAction } from "@/lib/hooks/use-action";
import { EditableRow } from "@/components/shared/editable-row";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Division = {
  id: string;
  standard_id: string;
  name: string;
};

type HolidayManagerProps = {
  schoolYearId: string;
  divisions: Division[];
  holidays: Holiday[];
  selectedStandardName: string | null;
};

const typeStyles: Record<Holiday["type"], { label: string; className: string }> = {
  national: { label: "National", className: "border-red-200 bg-red-50 text-red-700" },
  school_event: { label: "School Event", className: "border-blue-200 bg-blue-50 text-blue-700" },
  exam: { label: "Exam", className: "border-purple-200 bg-purple-50 text-purple-700" },
  unplanned: { label: "Unplanned", className: "border-amber-200 bg-amber-50 text-amber-700" },
};

function HolidayEditForm({
  holiday,
  divisions,
  onDone,
}: {
  holiday: Holiday;
  divisions: Division[];
  onDone: () => void;
}) {
  const [affectsAll, setAffectsAll] = useState(holiday.affects_all);
  const [type, setType] = useState<Holiday["type"]>(holiday.type);
  const [divisionId, setDivisionId] = useState(holiday.division_id ?? divisions[0]?.id ?? "");
  const action = useAction((fd) => updateHoliday(holiday.id, fd), {
    successMessage: "Holiday updated",
    onSuccess: onDone,
  });

  useEffect(() => {
    if (affectsAll) return;
    if (divisions.some((division) => division.id === divisionId)) return;
    setDivisionId(divisions[0]?.id ?? "");
  }, [affectsAll, divisionId, divisions]);

  return (
    <form onSubmit={action.handleSubmit} className="flex flex-col gap-2">
      <div className="grid grid-cols-2 gap-2">
        <div className="flex flex-col gap-1">
          <Label>Date</Label>
          <Input name="date" type="date" defaultValue={holiday.date} className="h-7 text-xs" required />
        </div>
        <div className="flex flex-col gap-1">
          <Label>Type</Label>
          <Select value={type} onValueChange={(value) => setType(value as Holiday["type"])}>
            <SelectTrigger className="h-7 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="national">National</SelectItem>
              <SelectItem value="school_event">School Event</SelectItem>
              <SelectItem value="exam">Exam</SelectItem>
              <SelectItem value="unplanned">Unplanned</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <input type="hidden" name="type" value={type} />
      <div className="flex flex-col gap-1">
        <Label>Name</Label>
        <Input name="name" defaultValue={holiday.name} className="h-7 text-xs" required />
      </div>
      <div className="flex flex-col gap-1">
        <Label>Scope</Label>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant={affectsAll ? "default" : "outline"}
            size="sm"
            className="h-7 text-xs"
            onClick={() => setAffectsAll(true)}
          >
            All classes
          </Button>
          <Button
            type="button"
            variant={!affectsAll ? "default" : "outline"}
            size="sm"
            className="h-7 text-xs"
            onClick={() => setAffectsAll(false)}
          >
            One division
          </Button>
        </div>
        <input type="hidden" name="affects_all" value={String(affectsAll)} />
      </div>
      {!affectsAll && (
        <div className="flex flex-col gap-1">
          <Label>Division</Label>
          <Select value={divisionId} onValueChange={setDivisionId}>
            <SelectTrigger className="h-7 text-xs">
              <SelectValue placeholder="Select division" />
            </SelectTrigger>
            <SelectContent>
              {divisions.map((division) => (
                <SelectItem key={division.id} value={division.id}>
                  Div {division.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      <input type="hidden" name="division_id" value={affectsAll ? "" : divisionId} />
      <Button type="submit" size="sm" className="h-7 text-xs w-fit" disabled={action.loading}>
        {action.loading ? "Saving..." : "Save"}
      </Button>
    </form>
  );
}

export function HolidayManager({
  schoolYearId,
  divisions,
  holidays,
  selectedStandardName,
}: HolidayManagerProps) {
  const router = useRouter();
  const [affectsAll, setAffectsAll] = useState(true);
  const [type, setType] = useState<Holiday["type"]>("school_event");
  const [divisionId, setDivisionId] = useState(divisions[0]?.id ?? "");
  const action = useAction(createHoliday, { successMessage: "Holiday created" });

  useEffect(() => {
    if (affectsAll) return;
    if (divisions.some((division) => division.id === divisionId)) return;
    setDivisionId(divisions[0]?.id ?? "");
  }, [affectsAll, divisionId, divisions]);

  const sortedHolidays = useMemo(
    () => [...holidays].sort((a, b) => a.date.localeCompare(b.date)),
    [holidays]
  );

  async function handleDelete(id: string) {
    const result = await deleteHoliday(id);
    if (result?.error) toast.error("Delete failed", { description: result.error });
    else toast.success("Holiday deleted");
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[360px_1fr]">
      <Card>
        <CardHeader className="border-b">
          <CardTitle className="text-lg">Add holiday</CardTitle>
          <p className="text-sm text-muted-foreground">
            {selectedStandardName ? `Scope for ${selectedStandardName}` : "Create a holiday for the active school year"}
          </p>
        </CardHeader>
        <CardContent className="pt-4">
          <form onSubmit={action.handleSubmit} className="flex flex-col gap-3">
            <input type="hidden" name="school_year_id" value={schoolYearId} />
            <input type="hidden" name="type" value={type} />
            <input type="hidden" name="affects_all" value={String(affectsAll)} />

            <div className="flex flex-col gap-1.5">
              <Label>Date</Label>
              <Input name="date" type="date" required />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>Name</Label>
              <Input name="name" placeholder="Diwali" required />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>Type</Label>
              <Select value={type} onValueChange={(value) => setType(value as Holiday["type"])}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="national">National</SelectItem>
                  <SelectItem value="school_event">School Event</SelectItem>
                  <SelectItem value="exam">Exam</SelectItem>
                  <SelectItem value="unplanned">Unplanned</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>Scope</Label>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant={affectsAll ? "default" : "outline"}
                  size="sm"
                  className="h-8 text-xs"
                  onClick={() => setAffectsAll(true)}
                >
                  All classes
                </Button>
                <Button
                  type="button"
                  variant={!affectsAll ? "default" : "outline"}
                  size="sm"
                  className="h-8 text-xs"
                  onClick={() => setAffectsAll(false)}
                >
                  One division
                </Button>
              </div>
            </div>

            {!affectsAll && (
              <div className="flex flex-col gap-1.5">
                <Label>Division</Label>
                <Select value={divisionId} onValueChange={setDivisionId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select division" />
                  </SelectTrigger>
                  <SelectContent>
                    {divisions.map((division) => (
                      <SelectItem key={division.id} value={division.id}>
                        Div {division.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <input type="hidden" name="division_id" value={affectsAll ? "" : divisionId} />

            <Button type="submit" disabled={action.loading || (!affectsAll && !divisionId)} className="w-full">
              {action.loading ? "Adding..." : "Add holiday"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="border-b">
          <div className="flex items-center justify-between gap-3">
            <div>
              <CardTitle className="text-lg">Holidays</CardTitle>
              <p className="text-sm text-muted-foreground">
                {sortedHolidays.length} holidays in this school year
              </p>
            </div>
            <Badge variant="outline" className="font-normal">
              Sorted by date
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          {sortedHolidays.length === 0 ? (
            <div className="rounded-xl border border-dashed bg-secondary/20 px-4 py-8 text-center text-sm text-muted-foreground">
              No holidays added yet.
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {sortedHolidays.map((holiday) => {
                const typeStyle = typeStyles[holiday.type];
                return (
                  <EditableRow
                    key={holiday.id}
                    editForm={<HolidayEditForm holiday={holiday} divisions={divisions} onDone={() => router.refresh()} />}
                    onDelete={() => handleDelete(holiday.id)}
                    deleteConfirmText="Delete holiday?"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{holiday.name}</span>
                          <Badge className={`h-5 border px-2 text-[10px] font-normal ${typeStyle.className}`}>
                            {typeStyle.label}
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(new Date(`${holiday.date}T00:00:00`))}
                        </div>
                      </div>
                      <Badge variant="outline" className="font-normal">
                        {holiday.affects_all ? "All classes" : `Div ${divisions.find((division) => division.id === holiday.division_id)?.name ?? "—"}`}
                      </Badge>
                    </div>
                  </EditableRow>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
