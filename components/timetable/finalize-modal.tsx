"use client";

import { useMemo, useState, useTransition } from "react";
import { CheckCircle2, Loader2, TriangleAlert, XCircle } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  finalizeTimetable,
  getPreflightCheck,
} from "@/lib/actions/timetable";
import type { AcademicSegment, Division, TimetableActivation } from "@/lib/types";

type PreflightItem = {
  id: string;
  label: string;
  detail?: string;
};

type PreflightResult = {
  hard_blocks: PreflightItem[];
  warnings: PreflightItem[];
};

type FinalizeModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  division: Division;
  segments: AcademicSegment[];
  activations: TimetableActivation[];
  currentTeacherId: string;
};

function formatDateRange(segment: AcademicSegment) {
  return `${segment.start_date} to ${segment.end_date}`;
}

function activationFor(activations: TimetableActivation[], divisionId: string, segmentId: string) {
  return activations.find((activation) => activation.division_id === divisionId && activation.segment_id === segmentId);
}

export function FinalizeModal({
  open,
  onOpenChange,
  division,
  segments,
  activations,
  currentTeacherId,
}: FinalizeModalProps) {
  const [selectedSegmentId, setSelectedSegmentId] = useState("");
  const [preflight, setPreflight] = useState<PreflightResult | null>(null);
  const [checking, setChecking] = useState(false);
  const [isPending, startTransition] = useTransition();

  const sortedSegments = useMemo(
    () => [...segments].sort((a, b) => a.sequence_number - b.sequence_number),
    [segments]
  );
  const selectedSegment = sortedSegments.find((segment) => segment.id === selectedSegmentId) ?? null;
  const hardBlocks = preflight?.hard_blocks ?? [];
  const warnings = preflight?.warnings ?? [];

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      setSelectedSegmentId("");
      setPreflight(null);
    }
    onOpenChange(nextOpen);
  }

  async function selectSegment(segmentId: string) {
    setSelectedSegmentId(segmentId);
    setChecking(true);
    const result = await getPreflightCheck(division.id, segmentId);
    setPreflight(result);
    setChecking(false);
  }

  function handleFinalize() {
    if (!selectedSegmentId || hardBlocks.length > 0) return;
    startTransition(async () => {
      const result = await finalizeTimetable(division.id, selectedSegmentId, currentTeacherId);
      if (result && "error" in result) {
        toast.error("Could not finalize timetable", { description: result.error });
        return;
      }
      if (result && "success" in result && !result.success) {
        toast.error("Could not finalize timetable");
        return;
      }
      toast.success("Timetable finalized — teachers can now see their schedule");
      handleOpenChange(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="w-[540px] rounded-[10px] bg-white shadow-xl sm:max-w-[540px]">
        <DialogHeader>
          <DialogTitle>Finalize Timetable — Div {division.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 p-5">
          <div>
            <div className="text-[11px] font-medium uppercase text-[#A3A3A3]">Select segment</div>
            <p className="mt-1 text-xs text-[#737373]">
              This timetable will go live for the selected segment&apos;s date range
            </p>
            <div className="mt-3 space-y-2">
              {sortedSegments.map((segment) => {
                const activation = activationFor(activations, division.id, segment.id);
                const selected = segment.id === selectedSegmentId;
                return (
                  <button
                    key={segment.id}
                    type="button"
                    onClick={() => selectSegment(segment.id)}
                    className={[
                      "flex w-full items-center justify-between rounded-md border p-3 text-left",
                      selected ? "border-[#171717] bg-[#FAFAFA]" : "border-[#E5E5E5] bg-white",
                    ].join(" ")}
                  >
                    <span>
                      <span className="block text-sm font-medium text-[#171717]">{segment.name}</span>
                      <span className="mt-0.5 block text-xs text-[#737373]">{formatDateRange(segment)}</span>
                    </span>
                    <Badge
                      className={[
                        "h-5 rounded border px-2 text-[11px] font-medium capitalize",
                        activation?.status === "finalized"
                          ? "border-green-200 bg-green-50 text-green-700"
                          : "border-amber-200 bg-amber-50 text-amber-700",
                      ].join(" ")}
                    >
                      {activation?.status ?? "draft"}
                    </Badge>
                  </button>
                );
              })}
            </div>
          </div>

          {selectedSegment && (
            <div className="space-y-3">
              {checking ? (
                <div className="flex items-center gap-2 rounded-md border border-[#E5E5E5] bg-[#FAFAFA] p-3 text-sm text-[#737373]">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Running checks...
                </div>
              ) : (
                <>
                  {hardBlocks.length > 0 && (
                    <div>
                      <div className="mb-2 text-[11px] font-medium uppercase text-[#A3A3A3]">Must fix before finalizing</div>
                      <div className="space-y-2">
                        {hardBlocks.map((item) => (
                          <div key={item.id} className="rounded-md border border-[#FECACA] bg-[#FEF2F2] p-3">
                            <div className="flex gap-2">
                              <XCircle className="mt-0.5 h-4 w-4 text-red-600" />
                              <div>
                                <div className="text-sm font-medium text-red-900">{item.label}</div>
                                {item.detail && <div className="mt-0.5 text-xs text-red-700">{item.detail}</div>}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {warnings.length > 0 && (
                    <div>
                      <div className="mb-2 text-[11px] font-medium uppercase text-[#A3A3A3]">Warnings</div>
                      <div className="space-y-2">
                        {warnings.map((item) => (
                          <div key={item.id} className="rounded-md border border-[#FED7AA] bg-[#FFFBEB] p-3">
                            <div className="flex gap-2">
                              <TriangleAlert className="mt-0.5 h-4 w-4 text-amber-600" />
                              <div>
                                <div className="text-sm font-medium text-amber-900">{item.label}</div>
                                {item.detail && <div className="mt-0.5 text-xs text-amber-700">{item.detail}</div>}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {hardBlocks.length === 0 && (
                    <div className="rounded-md border border-[#BBF7D0] bg-[#F0FDF4] p-3">
                      <div className="flex items-center gap-2 text-sm font-medium text-green-800">
                        <CheckCircle2 className="h-4 w-4" />
                        Ready to finalize
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="secondary"
              className="h-8 rounded-md border-[#E5E5E5] bg-[#F5F5F5] text-[#171717]"
              onClick={() => handleOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="h-8 rounded-md bg-[#ba2032] text-white hover:bg-[#ba2032]"
              onClick={handleFinalize}
              disabled={!selectedSegmentId || hardBlocks.length > 0 || checking || isPending}
            >
              {isPending ? <><Loader2 className="h-3.5 w-3.5 animate-spin" />Finalizing...</> : "Finalize timetable"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
