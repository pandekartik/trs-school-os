"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { AcademicSegment, Chapter, Standard, TimetableSlot } from "@/lib/types";
import { generateSchedule } from "@/lib/actions/timetable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { CheckCircle2, Loader2, TriangleAlert, XCircle } from "lucide-react";

type Division = {
  id: string;
  standard_id: string;
  name: string;
};

type SchoolYear = {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
};

type ScheduleGeneratorProps = {
  division: Division | null;
  schoolYear: SchoolYear | null;
  standard: Standard | null;
  segments: AcademicSegment[];
  chapters: Chapter[];
  slots: TimetableSlot[];
};

type ResultState = {
  created: number;
  buffer: number;
  scheduled_chapters: number;
};

export function ScheduleGenerator({
  division,
  schoolYear,
  standard,
  segments,
  chapters,
  slots,
}: ScheduleGeneratorProps) {
  const router = useRouter();
  const [selectedSegmentId, setSelectedSegmentId] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ResultState | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingExistingCount, setPendingExistingCount] = useState(0);
  const [pendingWarningLabel, setPendingWarningLabel] = useState("");

  const segmentOptions = useMemo(
    () => segments
      .filter((segment) => !standard || segment.standard_id === standard.id)
      .sort((a, b) => a.sequence_number - b.sequence_number),
    [segments, standard]
  );

  const selectedSegment = segmentOptions.find((segment) => segment.id === selectedSegmentId) ?? null;

  useEffect(() => {
    if (!selectedSegmentId) {
      setSelectedSegmentId(segmentOptions[0]?.id ?? "");
      return;
    }

    if (!segmentOptions.some((segment) => segment.id === selectedSegmentId)) {
      setSelectedSegmentId(segmentOptions[0]?.id ?? "");
    }
  }, [segmentOptions, selectedSegmentId]);

  const checklist = useMemo(() => {
    const slotCount = slots.length > 0;
    const chapterCount = Boolean(selectedSegment && chapters.some((chapter) => chapter.academic_segment_id === selectedSegment.id));
    const segmentDates = Boolean(selectedSegment?.start_date && selectedSegment?.end_date);

    return [
      { label: "Timetable slots configured", ok: slotCount },
      { label: "Chapters exist for the selected segment", ok: chapterCount },
      { label: "Academic segment has valid dates", ok: segmentDates },
    ];
  }, [chapters, selectedSegment, slots]);

  const canGenerate = checklist.every((item) => item.ok) && Boolean(division && schoolYear && selectedSegment);

  async function handleGenerate(confirmOverwrite = false) {
    if (!division || !schoolYear || !selectedSegment) return;
    setLoading(true);
    try {
      const response = await generateSchedule(division.id, selectedSegment.id, schoolYear.id, confirmOverwrite);
      if ("error" in response) {
        toast.error("Generate failed", { description: response.error });
        return;
      }

      if ("requiresConfirmation" in response && response.requiresConfirmation) {
        setPendingExistingCount(response.existingCount);
        setPendingWarningLabel(selectedSegment.name);
        setConfirmOpen(true);
        return;
      }

      setResult({
        created: response.created,
        buffer: response.buffer,
        scheduled_chapters: response.scheduled_chapters,
      });
      toast.success("Schedule generated");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  async function confirmGenerate() {
    setConfirmOpen(false);
    await handleGenerate(true);
  }

  if (!division || !schoolYear || !standard) {
    return (
      <Card className="flex min-h-[520px] items-center justify-center">
        <div className="text-center">
          <p className="text-sm font-medium">Select a standard and division first</p>
          <p className="mt-1 text-xs text-muted-foreground">
            The generator works on one division at a time.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <>
      <div className="grid gap-4 lg:grid-cols-[360px_1fr]">
        <Card>
          <CardHeader className="border-b">
            <CardTitle className="text-lg">Generate schedule</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 pt-4">
            <div className="flex flex-col gap-1.5">
              <div className="text-xs font-medium">Segment</div>
              <Select value={selectedSegmentId} onValueChange={setSelectedSegmentId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select segment" />
                </SelectTrigger>
                <SelectContent>
                  {segmentOptions.map((segment) => (
                    <SelectItem key={segment.id} value={segment.id}>
                      {segment.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[11px] text-muted-foreground">
                Filtered to {standard.name}
              </p>
            </div>

            <div className="rounded-xl border bg-secondary/20 px-3 py-3">
              <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Pre-generate checklist
              </div>
              <div className="flex flex-col gap-2">
                {checklist.map((item) => (
                  <div key={item.label} className="flex items-start gap-2 text-xs">
                    {item.ok ? (
                      <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-600" />
                    ) : (
                      <XCircle className="mt-0.5 h-4 w-4 text-red-600" />
                    )}
                    <span className={item.ok ? "text-foreground" : "text-red-700"}>
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <Button
              type="button"
              className="w-full"
              disabled={!canGenerate || loading}
              onClick={() => handleGenerate(false)}
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Generate Schedule
            </Button>

            {result && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-3 text-xs text-emerald-800">
                <div className="mb-1 font-semibold">Generation complete</div>
                <div>{result.created} period instances created</div>
                <div>{result.buffer} buffer periods</div>
                <div>{result.scheduled_chapters} chapters scheduled</div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="border-b">
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle className="text-lg">{selectedSegment?.name ?? "Select a segment"}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {division.name} · {schoolYear.name}
                </p>
              </div>
              <Badge variant="outline" className="font-normal">
                {slots.length} slots
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            {!selectedSegment ? (
              <div className="rounded-xl border border-dashed bg-secondary/20 px-4 py-10 text-center text-sm text-muted-foreground">
                Choose a segment to see the checklist and generate the schedule.
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <div className="rounded-xl border bg-secondary/20 px-4 py-3 text-sm">
                  <div className="flex items-center gap-2 font-medium">
                    <TriangleAlert className="h-4 w-4 text-amber-600" />
                    Regenerate warning
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    If period instances already exist for {selectedSegment.name}, regeneration will delete and rebuild them.
                    Unlogged periods will be lost.
                  </p>
                </div>

                <div className="rounded-xl border bg-card px-4 py-3">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    What the engine does
                  </div>
                  <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-muted-foreground">
                    <li>Uses active timetable slots for this division</li>
                    <li>Skips weekends and holidays</li>
                    <li>Assigns chapter periods in display order</li>
                    <li>Creates buffer periods when no chapter remains</li>
                  </ul>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Regenerate schedule?</AlertDialogTitle>
            <AlertDialogDescription>
              This will delete and regenerate all {pendingExistingCount} existing period instances for {pendingWarningLabel}.
              Unlogged periods will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmGenerate}>Regenerate</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
