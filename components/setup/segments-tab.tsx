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
import { Loader2, Plus, ChevronDown, ChevronUp } from "lucide-react";
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
  const [showAddForm, setShowAddForm] = useState(false);
  const [segmentType, setSegmentType] = useState("unit");
  const [seqNum, setSeqNum] = useState("1");

  const segAction = useAction(createAcademicSegment, { successMessage: "Segment created" });
  const selectedStandardData = standards.find((s) => s.id === selectedStandard);

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
    setShowAddForm(false);
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Pill Selector */}
      <div className="flex gap-2 flex-wrap">
        {standards.map((std) => (
          <button
            key={std.id}
            onClick={() => setSelectedStandard(std.id)}
            className={`px-4 py-1.5 rounded-full text-xs font-medium transition-colors ${
              selectedStandard === std.id
                ? "bg-gray-900 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {std.name}
          </button>
        ))}
      </div>

      {/* Segments Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>
                {selectedStandardData?.name || "Segments"}
              </CardTitle>
            </div>
            <div className="flex items-center gap-3">
              {currentSegments.length > 0 && (
                <Badge variant="outline" className="font-normal">{currentSegments.length} segments</Badge>
              )}
              <Button
                size="sm"
                variant="secondary"
                className="h-8 text-xs"
                disabled={!selectedStandard || !activeYear}
                onClick={bulkCreate}
              >
                Quick create 4 segments
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex flex-col gap-4">
          {!activeYear && (
            <div className="px-3 py-2 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-700">
              No active school year. Set one first.
            </div>
          )}

          {currentSegments.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-xs text-gray-600">No segments for this standard. Use Quick create to add all 4 at once.</p>
            </div>
          ) : (
            <>
              {/* Segments List */}
              <div className="flex flex-col gap-0 border border-gray-200 rounded-sm overflow-hidden">
                <div className="grid grid-cols-5 gap-4 px-3 py-2 bg-gray-50 border-b border-gray-200 text-xs font-semibold uppercase text-gray-600">
                  <div>ID</div>
                  <div>Name</div>
                  <div>Type</div>
                  <div>Dates</div>
                  <div></div>
                </div>
                {currentSegments.map((seg) => (
                  <EditableRow
                    key={seg.id}
                    editForm={<EditSegmentForm seg={seg} />}
                    onDelete={() => handleDelete(seg.id)}
                    className="border-b border-gray-100 last:border-b-0 bg-white px-0 py-0 rounded-none hover:bg-gray-50"
                  >
                    <div className="grid grid-cols-5 gap-4 px-3 py-2.5 items-center w-full">
                      <div><code className="text-[11px] text-muted-foreground font-mono">{seg.display_id}</code></div>
                      <div className="text-xs font-medium text-gray-900">{seg.name}</div>
                      <div>
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
                      <div className="text-xs text-gray-500">
                        {seg.start_date} → {seg.end_date}
                      </div>
                    </div>
                  </EditableRow>
                ))}
              </div>
            </>
          )}

          {/* Collapsible Add Form */}
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-2 text-xs font-medium text-gray-700 hover:text-gray-900 py-2"
          >
            {showAddForm ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            Add segment manually
          </button>

          {showAddForm && (
            <form onSubmit={segAction.handleSubmit} className="flex flex-col gap-3 pt-3 border-t border-gray-200">
              <input type="hidden" name="school_year_id" value={activeYear?.id ?? ""} />
              <input type="hidden" name="standard_id" value={selectedStandard} />
              <input type="hidden" name="segment_type" value={segmentType} />
              <input type="hidden" name="sequence_number" value={seqNum} />

              <div className="flex flex-col gap-1.5">
                <Label>Segment name</Label>
                <Input name="name" placeholder="e.g. Unit 1" className="h-8 text-xs" required />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="flex flex-col gap-1.5">
                  <Label>Type</Label>
                  <Select value={segmentType} onValueChange={setSegmentType}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unit">Unit</SelectItem>
                      <SelectItem value="term">Term</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label>Sequence</Label>
                  <Select value={seqNum} onValueChange={setSeqNum}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
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
                  <Input name="start_date" type="date" className="h-8 text-xs" required />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label>End date</Label>
                  <Input name="end_date" type="date" className="h-8 text-xs" required />
                </div>
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={segAction.loading || !selectedStandard || !activeYear} size="sm" className="h-8 text-xs">
                  {segAction.loading
                    ? <><Loader2 className="h-3 w-3 animate-spin" /></>
                    : <><Plus className="h-3.5 w-3.5" /></>
                  }
                  Add
                </Button>
                <Button type="button" variant="ghost" size="sm" className="h-8 text-xs" onClick={() => setShowAddForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
