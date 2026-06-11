"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { X, Loader2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import type { LeaveRequest } from "@/lib/types";
import { approveLeaveRequest } from "@/lib/actions/teacher";

type Candidate = {
  teacher: any;
  load: number;
  subjects: string[];
};

type Props = {
  leaveRequest: LeaveRequest;
  teachers: any[];
  reviewedBy: string;
  onClose: () => void;
  onComplete: () => void;
};

export function SubstitutionPanel({
  leaveRequest,
  teachers,
  reviewedBy,
  onClose,
  onComplete,
}: Props) {
  const [loading, setLoading] = useState(true);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [selectedSubstituteId, setSelectedSubstituteId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [approving, setApproving] = useState(false);
  const [useFreeSlot, setUseFreeSlot] = useState(false);

  useEffect(() => {
    const fetchCandidates = async () => {
      try {
        setLoading(true);
        // Filter teachers: exclude the one on leave
        const availableTeachers = teachers.filter(t => t.id !== leaveRequest.teacher_id);

        // For now, we'll just show all available teachers
        // In a real app, you'd fetch their load and subjects from DB
        const candidateList: Candidate[] = availableTeachers.map(t => ({
          teacher: t,
          load: 0, // Would be calculated from period_instances
          subjects: [], // Would be fetched from teacher_assignment
        }));

        setCandidates(candidateList);
      } catch (error) {
        toast.error("Error loading teachers");
      } finally {
        setLoading(false);
      }
    };

    fetchCandidates();
  }, [leaveRequest, teachers]);

  const filteredCandidates = candidates.filter(c =>
    c.teacher.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  async function handleConfirm() {
    if (!useFreeSlot && !selectedSubstituteId) {
      toast.error("Please select a substitute teacher or mark as free period");
      return;
    }

    setApproving(true);
    try {
      const result = await approveLeaveRequest(
        leaveRequest.id,
        reviewedBy,
        useFreeSlot ? undefined : (selectedSubstituteId || undefined)
      );

      if (result?.error) {
        toast.error("Approval failed", { description: result.error });
      } else {
        toast.success("Leave approved" + (selectedSubstituteId ? " and substitute assigned" : ""));
        onComplete();
      }
    } catch {
      toast.error("Error processing request");
    } finally {
      setApproving(false);
    }
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
    });
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50">
      <div className="absolute right-0 top-0 h-full w-full max-w-2xl bg-white border-l border-border shadow-lg flex flex-col">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="text-lg font-semibold">
            Assign Substitute for {teachers.find((t) => t.id === leaveRequest.teacher_id)?.name}
          </h2>
          <Button variant="ghost" size="sm" className="size-8 p-0" onClick={onClose}>
            <X className="size-4" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          {/* Leave Summary */}
          <div className="px-4 py-3 rounded-lg bg-amber-50 border border-amber-200 text-sm">
            <p className="font-medium text-amber-900">
              {leaveRequest.leave_type.toUpperCase()} LEAVE
            </p>
            <p className="text-amber-700 mt-1">
              {formatDate(leaveRequest.from_date)} to {formatDate(leaveRequest.to_date)} ·{" "}
              {leaveRequest.total_days} days
            </p>
            <p className="text-xs text-amber-600 mt-2">{leaveRequest.reason}</p>
          </div>

          {/* Free Period Option */}
          <div className="space-y-3">
            <Label className="text-xs font-medium uppercase">Mark as Free Period?</Label>
            <label className="flex items-center gap-3 p-3 rounded-lg border-2 border-border cursor-pointer hover:bg-muted/50 transition">
              <input
                type="radio"
                name="substituteType"
                checked={useFreeSlot}
                onChange={() => {
                  setUseFreeSlot(true);
                  setSelectedSubstituteId(null);
                }}
                className="w-4 h-4"
              />
              <span className="flex-1">
                <p className="font-medium text-sm">No Substitute Needed - Free Period</p>
                <p className="text-xs text-muted-foreground mt-1">Mark these classes as free periods</p>
              </span>
            </label>
            {useFreeSlot && (
              <div className="flex gap-2 items-start px-3 py-2 rounded-lg bg-amber-50 border border-amber-200">
                <AlertTriangle className="size-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-700">
                  Classes will be marked as free periods during this leave. No substitute coverage will be assigned.
                </p>
              </div>
            )}
          </div>

          {/* Substitute Selector */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <input
                type="radio"
                name="substituteType"
                checked={!useFreeSlot}
                onChange={() => setUseFreeSlot(false)}
                className="w-4 h-4"
              />
              <Label className="text-xs font-medium uppercase">Assign Substitute Teacher</Label>
            </div>

            {!useFreeSlot && (
              <>
                <Input
                  placeholder="Search teacher by name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="text-sm"
                />

                {loading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="size-5 animate-spin text-muted-foreground" />
                  </div>
                ) : filteredCandidates.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-sm text-muted-foreground">
                      {searchQuery ? "No teachers found" : "No teachers available"}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {filteredCandidates.map((candidate) => (
                      <div key={candidate.teacher.id}>
                        <input
                          type="radio"
                          id={`sub-${candidate.teacher.id}`}
                          name="substitute"
                          value={candidate.teacher.id}
                          checked={selectedSubstituteId === candidate.teacher.id}
                          onChange={(e) => setSelectedSubstituteId(e.target.value)}
                          className="hidden"
                        />
                        <label
                          htmlFor={`sub-${candidate.teacher.id}`}
                          className={`block p-3 rounded-lg border-2 cursor-pointer transition ${
                            selectedSubstituteId === candidate.teacher.id
                              ? "border-brand bg-brand/5"
                              : "border-border hover:border-border/50"
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="font-medium text-sm">{candidate.teacher.name}</p>
                              {candidate.teacher.email && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  {candidate.teacher.email}
                                </p>
                              )}
                            </div>
                          </div>
                        </label>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Summary */}
          <div className="text-sm space-y-1 py-3 border-t border-border">
            <p className="text-muted-foreground">
              <span className="font-medium text-foreground">{leaveRequest.total_days}</span> periods
              will be {useFreeSlot ? "marked as free" : "assigned to the selected substitute"}.
            </p>
          </div>
        </div>

        <div className="border-t border-border px-6 py-4 flex gap-2">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={approving || (!useFreeSlot && !selectedSubstituteId)}
            className="flex-1"
          >
            {approving ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Approving...
              </>
            ) : (
              "Approve & Continue"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
