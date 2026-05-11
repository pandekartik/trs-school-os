"use client";

import { useState } from "react";
import { AcademicSegment, Standard, SchoolYear } from "@/lib/types";
import {
  createAcademicSegment, updateAcademicSegment, deleteAcademicSegment,
} from "@/lib/actions/setup";
import { useAction } from "@/lib/hooks/use-action";
import { EditableRow } from "@/components/shared/editable-row";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";

const PRESETS = [
  { name: "Unit 1",  type: "unit", seq: 1 },
  { name: "Term 1",  type: "term", seq: 2 },
  { name: "Unit 2",  type: "unit", seq: 3 },
  { name: "Term 2",  type: "term", seq: 4 },
];

function EditSegmentForm({ seg }: { seg: AcademicSegment }) {
  const action = useAction((fd) => updateAcademicSegment(seg.id, fd), {
    successMessage: "Segment updated",
  });
  return (
    <form onSubmit={action.handleSubmit} className="flex flex-col gap-2">
      <div className="grid grid-cols-3 gap-2">
        <div className="flex flex-col gap-1">
          <Label>Name</Label>
          <Input name="name" defaultValue={seg.name} className="h-7 text-xs" required />
        </div>
        <div className="flex flex-col gap-1">
          <Label>Start</Label>
          <Input name="start_date" type="date" defaultValue={seg.start_date} className="h-7 text-xs" required />
        </div>
        <div className="flex flex-col gap-1">
          <Label>End</Label>
          <Input name="end_date" type="date" defaultValue={seg.end_date} className="h-7 text-xs" required />
        </div>
      </div>
      <Button type="submit" size="sm" className="h-7 text-xs w-fit" disabled={action.loading}>
        {action.loading ? <Loader2 className="h-3 w-3 animate-spin" /> : "Save changes"}
      </Button>
    </form>
  );
}

export function SegmentsTab({
  segments, standards, schoolYears,
}: {
  segments: AcademicSegment[];
  standards: Standard[];
  schoolYears: SchoolYear[];
}) {
  const activeYear = schoolYears.find((y) => y.is_active);
  const [selectedStandard, setSelectedStandard] = useState(standards[0]?.id ?? "");
  const [segmentType, setSegmentType] = useState("unit");
  const [seqNum, setSeqNum] = useState("1");

  const segAction = useAction(createAcademicSegment, { successMessage: "Segment created" });

  const currentSegments = segments
    .filter((s) => s.standard_id === selectedStandard)
    .sort((a, b) => a.sequence_number - b.sequence_number);

  async function handleDelete(id: string) {
    const r = await deleteAcademicSegment(id);
    if (r?.error) toast.error("Delete failed", { description: r.error });
    else toast.success("Deleted");
  }

  async function bulkCreate() {
    if (!selectedStandard || !activeYear) return;
    for (const p of PRESETS) {
      const fd = new FormData();
      fd.append("school_year_id", activeYear.id);
      fd.append("standard_id", selectedStandard);
      fd.append("name", p.name);
      fd.append("segment_type", p.type);
      fd.append("sequence_number", String(p.seq));
      fd.append("start_date", activeYear.start_date);
      fd.append("end_date", activeYear.end_date);
      await createAcademicSegment(fd);
    }
    toast.success("4 segments created — update the dates for each");
  }

  return (
    <div className="grid grid-cols-2 gap-4">
      <Card>
        <CardHeader><CardTitle>Add segment</CardTitle></CardHeader>
        <CardContent>
          {!activeYear && (
            <div className="px-3 py-2 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-700 mb-3">
              No active school year. Set one first.
            </div>
          )}
          <form onSubmit={segAction.handleSubmit} className="flex flex-col gap-3">
            <input type="hidden" name="school_year_id" value={activeYear?.id ?? ""} />
            <input type="hidden" name="standard_id" value={selectedStandard} />
            <input type="hidden" name="segment_type" value={segmentType} />
            <input type="hidden" name="sequence_number" value={seqNum} />

            <div className="flex flex-col gap-1.5">
              <Label>Standard</Label>
              <Select value={selectedStandard} onValueChange={setSelectedStandard}>
                <SelectTrigger><SelectValue placeholder="Select standard" /></SelectTrigger>
                <SelectContent>
                  {standards.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>Segment name</Label>
              <Input name="name" placeholder="e.g. Unit 1" required />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div className="flex flex-col gap-1.5">
                <Label>Type</Label>
                <Select value={segmentType} onValueChange={setSegmentType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unit">Unit</SelectItem>
                    <SelectItem value="term">Term</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Sequence</Label>
                <Select value={seqNum} onValueChange={setSeqNum}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1st</SelectItem>
                    <SelectItem value="2">2nd</SelectItem>
                    <SelectItem value="3">3rd</SelectItem>
                    <SelectItem value="4">4th</SelectItem>
                  </SelectContent>
                </Select>
              </div>
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

            <Button type="submit" disabled={segAction.loading || !selectedStandard || !activeYear} className="w-full">
              {segAction.loading
                ? <><Loader2 className="h-3.5 w-3.5 animate-spin" />Adding...</>
                : <><Plus className="h-3.5 w-3.5" />Add segment</>
              }
            </Button>

            <div className="h-px bg-border" />

            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full text-xs"
              disabled={!selectedStandard || !activeYear}
              onClick={bulkCreate}
            >
              Quick create all 4 segments for this standard
            </Button>
            <p className="text-[11px] text-muted-foreground text-center -mt-1">
              Creates Unit 1, Term 1, Unit 2, Term 2 — edit dates after
            </p>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>
              Segments
              {selectedStandard && (
                <span className="font-normal text-muted-foreground ml-1.5">
                  — {standards.find((s) => s.id === selectedStandard)?.name}
                </span>
              )}
            </CardTitle>
            <Select value={selectedStandard} onValueChange={setSelectedStandard}>
              <SelectTrigger className="h-7 text-xs w-28">
                <SelectValue placeholder="Standard" />
              </SelectTrigger>
              <SelectContent>
                {standards.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {currentSegments.length === 0 ? (
            <div className="text-center py-8 text-xs text-muted-foreground">
              No segments yet. Use Quick create to add all 4 at once.
            </div>
          ) : (
            <div className="flex flex-col gap-1.5">
              {currentSegments.map((seg) => {
                return (
                  <EditableRow
                    key={seg.id}
                    editForm={<EditSegmentForm seg={seg} />}
                    onDelete={() => handleDelete(seg.id)}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium">{seg.name}</span>
                      <Badge
                        className="text-[10px] h-5 px-2 font-normal border"
                        style={{
                          color: seg.segment_type === "unit" ? "#185FA5" : "#3B6D11",
                          borderColor: seg.segment_type === "unit" ? "#b5d4f4" : "#c0dd97",
                          background: seg.segment_type === "unit" ? "#e6f1fb" : "#eaf3de",
                        }}
                      >
                        {seg.segment_type}
                      </Badge>
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      {seg.start_date} → {seg.end_date}
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
