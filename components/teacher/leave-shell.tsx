"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, Plus, CalendarOff, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";
import { LeaveApplyPanel } from "./leave-apply-panel";
import { SubstitutionPanel } from "./substitution-panel";
import { cancelLeaveRequest, approveLeaveRequest, rejectLeaveRequest } from "@/lib/actions/teacher";
import type { LeaveRequest, LeavePolicy } from "@/lib/types";
import type { UserRole } from "@/lib/role-access";

const leaveTypeBadgeColor: Record<string, string> = {
  sick: "bg-red-100 text-red-800",
  casual: "bg-blue-100 text-blue-800",
  emergency: "bg-amber-100 text-amber-800",
  official: "bg-purple-100 text-purple-800",
};

const statusBadgeColor: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  approved: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
  cancelled: "bg-gray-100 text-gray-800",
};

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Props = {
  role: UserRole | null;
  profile: any;
  leaveRequests: LeaveRequest[];
  policies: LeavePolicy[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  balances: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  teachers: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  branches: any[];
  branchId: string | null;
  schoolYearId: string;
  pendingCount: number;
};

export function LeaveShell({
  role,
  profile,
  leaveRequests,
  policies,
  balances,
  teachers,
  branches,
  branchId,
  schoolYearId,
  pendingCount,
}: Props) {
  const [applyPanelOpen, setApplyPanelOpen] = useState(false);
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"pending" | "all" | "by_teacher">(
    role === "teacher" ? "all" : "pending"
  );
  const [filterTeacherId, setFilterTeacherId] = useState("");
  const [filterBranchId, setFilterBranchId] = useState("");
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectingRequestId, setRejectingRequestId] = useState<string | null>(null);
  const [rejectComment, setRejectComment] = useState("");
  const [substitutionPanelOpen, setSubstitutionPanelOpen] = useState(false);
  const [approvingRequest, setApprovingRequest] = useState<LeaveRequest | null>(null);
  const [rejectingLoading, setRejectingLoading] = useState(false);

  const isTeacher = role === "teacher";

  // Filter requests based on tab, teacher, and branch
  let displayRequests = leaveRequests;
  if (filterBranchId && !isTeacher) {
    displayRequests = displayRequests.filter((r) => r.branch_id === filterBranchId);
  }
  if (activeTab === "pending") {
    displayRequests = displayRequests.filter((r) => r.status === "pending");
  }
  if (activeTab === "by_teacher" && filterTeacherId) {
    displayRequests = displayRequests.filter((r) => r.teacher_id === filterTeacherId);
  }

  async function handleCancelRequest(requestId: string) {
    try {
      const result = await cancelLeaveRequest(requestId);
      if (result?.error) {
        toast.error("Cancel failed", { description: result.error });
      } else {
        toast.success("Leave request cancelled");
        window.location.reload();
      }
    } catch {
      toast.error("Error cancelling request");
    }
  }

  async function handleApprove(request: LeaveRequest) {
    // Open substitution panel first (without approving yet)
    setApprovingRequest(request);
    setSubstitutionPanelOpen(true);
  }

  async function handleConfirmReject() {
    if (!rejectingRequestId) return;

    setRejectingLoading(true);
    try {
      const result = await rejectLeaveRequest(rejectingRequestId, profile.id, rejectComment);
      if (result?.error) {
        toast.error("Rejection failed", { description: result.error });
      } else {
        toast.success("Leave request rejected");
        setRejectModalOpen(false);
        setRejectingRequestId(null);
        setRejectComment("");
        window.location.reload();
      }
    } catch {
      toast.error("Error rejecting request");
    } finally {
      setRejectingLoading(false);
    }
  }

  return (
    <>
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Leave Requests</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {isTeacher
                ? "Apply for leave and track your applications."
                : "Review and manage teacher leave applications."}
            </p>
          </div>
          {isTeacher && (
            <Button onClick={() => setApplyPanelOpen(true)} className="gap-2">
              <Plus className="size-4" />
              Apply for leave
            </Button>
          )}
          {!isTeacher && pendingCount > 0 && (
            <Badge variant="default" className="text-base">
              {pendingCount} pending
            </Badge>
          )}
        </div>

        {/* Balance Cards - Teacher Only */}
        {isTeacher && policies.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {policies.map((policy) => {
              const balance = balances.find((b) => b.leave_type === policy.leave_type);
              const used = balance?.used_days ?? 0;
              const remaining = policy.days_allowed - used;
              const statusColor =
                remaining <= 0
                  ? "text-red-600"
                  : remaining <= 3
                    ? "text-amber-600"
                    : "text-green-600";

              return (
                <div
                  key={policy.id}
                  className="rounded-lg border border-border bg-card p-4"
                >
                  <p className="text-xs font-medium uppercase text-muted-foreground">
                    {policy.name}
                  </p>
                  <p className={`text-2xl font-semibold mt-2 ${statusColor}`}>
                    {remaining}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {used} / {policy.days_allowed} days used
                  </p>
                </div>
              );
            })}
          </div>
        )}

        {/* Admin Tabs */}
        {!isTeacher && (
          <div className="flex gap-2 border-b border-border">
            <button
              onClick={() => setActiveTab("pending")}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition ${
                activeTab === "pending"
                  ? "border-brand text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              Pending
              {pendingCount > 0 && (
                <Badge variant="secondary" className="ml-2 text-xs">
                  {pendingCount}
                </Badge>
              )}
            </button>
            <button
              onClick={() => setActiveTab("all")}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition ${
                activeTab === "all"
                  ? "border-brand text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setActiveTab("by_teacher")}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition ${
                activeTab === "by_teacher"
                  ? "border-brand text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              By Teacher
            </button>
          </div>
        )}

        {/* Filters - Admin Only */}
        {!isTeacher && (
          <div className="flex gap-2 flex-wrap">
            <select
              value={filterBranchId}
              onChange={(e) => setFilterBranchId(e.target.value)}
              className="px-3 py-2 rounded border border-border text-sm"
            >
              <option value="">All branches</option>
              {branches.map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {branch.name}
                </option>
              ))}
            </select>

            {activeTab === "by_teacher" && (
              <select
                value={filterTeacherId}
                onChange={(e) => setFilterTeacherId(e.target.value)}
                className="px-3 py-2 rounded border border-border text-sm"
              >
                <option value="">Select a teacher...</option>
                {teachers.map((teacher) => (
                  <option key={teacher.id} value={teacher.id}>
                    {teacher.name}
                  </option>
                ))}
              </select>
            )}
          </div>
        )}

        {/* Leave Requests Table */}
        <div className="border border-border rounded-lg overflow-hidden">
          <div className="bg-muted/50 border-b border-border px-4 py-3">
            <p className="text-sm font-medium">
              Leave requests{" "}
              <span className="text-muted-foreground font-normal">
                ({displayRequests.length})
              </span>
            </p>
          </div>

          {displayRequests.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
              <CalendarOff className="size-10 text-muted-foreground" />
              <div>
                <p className="font-medium">
                  {isTeacher
                    ? "No leave requests yet"
                    : "No leave requests to display"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {isTeacher
                    ? "Apply for leave using the button above"
                    : "There are no pending requests"}
                </p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-b">
                    {!isTeacher && <TableHead>TEACHER</TableHead>}
                    <TableHead>ID</TableHead>
                    <TableHead>TYPE</TableHead>
                    <TableHead>DATES</TableHead>
                    <TableHead>REASON</TableHead>
                    <TableHead>STATUS</TableHead>
                    {(isTeacher || (!isTeacher && activeTab !== "pending")) && (
                      <TableHead>REVIEWED</TableHead>
                    )}
                    <TableHead>ACTIONS</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayRequests.map((request) => (
                    <React.Fragment key={request.id}>
                      <TableRow
                        className="hover:bg-muted/30 cursor-pointer"
                        onClick={() =>
                          setExpandedRowId(
                            expandedRowId === request.id ? null : request.id
                          )
                        }
                      >
                        {!isTeacher && (
                          <TableCell>
                            <p className="text-sm font-medium">
                              {teachers.find((t) => t.id === request.teacher_id)
                                ?.name ?? "Unknown"}
                            </p>
                          </TableCell>
                        )}
                        <TableCell>
                          <code className="text-[11px] text-muted-foreground font-mono">
                            {request.display_id}
                          </code>
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={`text-xs ${
                              leaveTypeBadgeColor[request.leave_type]
                            }`}
                            variant="secondary"
                          >
                            {request.leave_type}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(request.from_date)} →{" "}
                          {formatDate(request.to_date)}
                          <Badge variant="outline" className="ml-2 text-xs">
                            {request.total_days}d
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm max-w-xs truncate">
                          {request.reason}
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={`text-xs ${
                              statusBadgeColor[request.status]
                            }`}
                            variant="secondary"
                          >
                            {request.status}
                          </Badge>
                        </TableCell>
                        {(isTeacher || (!isTeacher && activeTab !== "pending")) && (
                          <TableCell className="text-xs text-muted-foreground">
                            {request.reviewed_by && request.reviewed_at ? (
                              <>
                                <div>
                                  {teachers.find((t) => t.id === request.reviewed_by)
                                    ?.name ?? "Admin"}
                                </div>
                                <div>
                                  {formatDate(request.reviewed_at)}
                                </div>
                              </>
                            ) : (
                              <span className="text-muted-foreground/70">—</span>
                            )}
                          </TableCell>
                        )}
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {isTeacher && request.status === "pending" && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-xs"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCancelRequest(request.id);
                                }}
                              >
                                Cancel
                              </Button>
                            )}
                            {!isTeacher && request.status === "pending" && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-xs text-green-600 hover:text-green-700"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleApprove(request);
                                  }}
                                >
                                  Approve
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-xs text-red-600 hover:text-red-700"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setRejectingRequestId(request.id);
                                    setRejectModalOpen(true);
                                  }}
                                >
                                  Reject
                                </Button>
                              </>
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setExpandedRowId(
                                  expandedRowId === request.id ? null : request.id
                                );
                              }}
                              className="hover:bg-muted/50 p-1 rounded"
                            >
                              {expandedRowId === request.id ? (
                                <ChevronUp className="size-4 text-muted-foreground" />
                              ) : (
                                <ChevronDown className="size-4 text-muted-foreground" />
                              )}
                            </button>
                          </div>
                        </TableCell>
                      </TableRow>
                      {expandedRowId === request.id && (
                        <TableRow className="bg-muted/30">
                          <TableCell
                            colSpan={
                              isTeacher ? 7 : activeTab === "pending" ? 8 : 9
                            }
                            className="py-4"
                          >
                            <div className="text-sm space-y-3">
                              <div>
                                <p className="font-medium text-muted-foreground">
                                  Full Reason
                                </p>
                                <p className="mt-1">{request.reason}</p>
                              </div>
                              {request.status === "rejected" &&
                                request.review_comment && (
                                  <div className="border-l-2 border-red-500 pl-3 py-2">
                                    <p className="font-medium text-red-600 text-xs">
                                      Rejection Comment
                                    </p>
                                    <p className="mt-1 text-red-700">
                                      {request.review_comment}
                                    </p>
                                  </div>
                                )}
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>

      {/* Apply Leave Panel */}
      {applyPanelOpen && (
        <LeaveApplyPanel
          policies={policies}
          balances={balances}
          teacherId={profile.id}
          schoolYearId={schoolYearId}
          branchId={branchId}
          onClose={() => setApplyPanelOpen(false)}
        />
      )}

      {/* Substitution Panel */}
      {substitutionPanelOpen && approvingRequest && (
        <SubstitutionPanel
          leaveRequest={approvingRequest}
          teachers={teachers}
          reviewedBy={profile.id}
          onClose={() => {
            setSubstitutionPanelOpen(false);
            setApprovingRequest(null);
          }}
          onComplete={() => {
            setSubstitutionPanelOpen(false);
            setApprovingRequest(null);
            window.location.reload();
          }}
        />
      )}

      {/* Reject Modal */}
      <Dialog open={rejectModalOpen} onOpenChange={setRejectModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Leave Request</DialogTitle>
            <DialogDescription>
              Provide a reason for rejecting this leave request.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label htmlFor="comment" className="text-xs font-medium uppercase">
                Rejection Reason
              </label>
              <textarea
                id="comment"
                value={rejectComment}
                onChange={(e) => setRejectComment(e.target.value)}
                placeholder="Enter rejection reason..."
                className="w-full mt-2 px-3 py-2 text-sm border border-border rounded resize-none"
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => {
                setRejectModalOpen(false);
                setRejectingRequestId(null);
                setRejectComment("");
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmReject}
              disabled={rejectingLoading || !rejectComment.trim()}
            >
              {rejectingLoading ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Rejecting...
                </>
              ) : (
                "Reject Request"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
