"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, UserCheck } from "lucide-react";
import { toast } from "sonner";
import type { LeaveRequest } from "@/lib/types";
import { approveLeaveRequest, getSuggestedSubstitute, rejectLeaveRequest } from "@/lib/actions/teacher";

type Candidate = { id: string; name: string; scheduled_periods: number };

type Props = {
  request: LeaveRequest & { teacher?: { name: string } };
  reviewerId: string;
  onClose: () => void;
};

export function SubstitutionPanel({ request, reviewerId, onClose }: Props) {
  const [mode, setMode] = useState<"approve" | "reject">("approve");
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loadingCandidates, setLoadingCandidates] = useState(true);
  const [selectedSubstituteId, setSelectedSubstituteId] = useState<string>("");
  const [rejectComment, setRejectComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getSuggestedSubstitute(request.id).then((result) => {
      if (cancelled) return;
      if (result.candidates) {
        setCandidates(result.candidates);
        setSelectedSubstituteId(result.candidates[0]?.id ?? "");
      }
      setLoadingCandidates(false);
    });
    return () => {
      cancelled = true;
    };
  }, [request.id]);

  async function handleApprove() {
    setSubmitting(true);
    try {
      const result = await approveLeaveRequest(request.id, reviewerId, selectedSubstituteId || undefined);
      if (result?.error) {
        toast.error("Could not approve", { description: result.error });
      } else {
        toast.success("Leave request approved");
        onClose();
        window.location.reload();
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleReject() {
    if (!rejectComment.trim()) {
      toast.error("Please add a comment explaining the rejection");
      return;
    }
    setSubmitting(true);
    try {
      const result = await rejectLeaveRequest(request.id, reviewerId, rejectComment.trim());
      if (result?.error) {
        toast.error("Could not reject", { description: result.error });
      } else {
        toast.success("Leave request rejected");
        onClose();
        window.location.reload();
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {request.teacher?.name ?? "Teacher"}'s {request.leave_type} leave — {request.display_id}
          </DialogTitle>
          <DialogDescription>
            {request.from_date} → {request.to_date} ({request.total_days} day{request.total_days > 1 ? "s" : ""})
            <br />
            {request.reason}
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-2">
          <Button
            variant={mode === "approve" ? "default" : "outline"}
            size="sm"
            onClick={() => setMode("approve")}
          >
            Approve
          </Button>
          <Button
            variant={mode === "reject" ? "destructive" : "outline"}
            size="sm"
            onClick={() => setMode("reject")}
          >
            Reject
          </Button>
        </div>

        {mode === "approve" ? (
          <div className="space-y-3">
            <p className="text-sm font-medium flex items-center gap-2">
              <UserCheck className="size-4" />
              Assign a substitute (optional)
            </p>
            {loadingCandidates ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" />
                Finding available teachers...
              </div>
            ) : candidates.length === 0 ? (
              <p className="text-sm text-muted-foreground">No other teachers available to suggest.</p>
            ) : (
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {candidates.map((c) => (
                  <label
                    key={c.id}
                    className="flex items-center justify-between gap-2 rounded-md border border-border px-3 py-2 text-sm cursor-pointer hover:bg-muted/40"
                  >
                    <span className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="substitute"
                        checked={selectedSubstituteId === c.id}
                        onChange={() => setSelectedSubstituteId(c.id)}
                      />
                      {c.name}
                    </span>
                    <span className="text-xs text-muted-foreground">{c.scheduled_periods} periods scheduled</span>
                  </label>
                ))}
                <button
                  type="button"
                  className="text-xs text-muted-foreground underline mt-1"
                  onClick={() => setSelectedSubstituteId("")}
                >
                  Don&apos;t assign a substitute
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            <Textarea
              value={rejectComment}
              onChange={(e) => setRejectComment(e.target.value)}
              placeholder="Reason for rejecting this request"
              rows={3}
            />
          </div>
        )}

        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          {mode === "approve" ? (
            <Button onClick={handleApprove} disabled={submitting}>
              {submitting ? <><Loader2 className="size-4 animate-spin" />Approving...</> : "Approve request"}
            </Button>
          ) : (
            <Button variant="destructive" onClick={handleReject} disabled={submitting}>
              {submitting ? <><Loader2 className="size-4 animate-spin" />Rejecting...</> : "Reject request"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
