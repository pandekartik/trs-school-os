"use client";

import { useState } from "react";
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
import { Plane, Plus } from "lucide-react";
import { toast } from "sonner";
import type { LeaveBalance, LeavePolicy, LeaveRequest, SchoolYear } from "@/lib/types";
import type { UserRole } from "@/lib/role-access";
import { cancelLeaveRequest } from "@/lib/actions/teacher";
import { LeaveApplyPanel } from "./leave-apply-panel";
import { SubstitutionPanel } from "./substitution-panel";
import { formatDateOnly } from "@/lib/utils/date";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700",
  approved: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
  cancelled: "bg-gray-100 text-gray-600",
};

type Props = {
  role: UserRole | null;
  isReviewer: boolean;
  currentTeacherId: string;
  activeSchoolYear: SchoolYear | null;
  policies: LeavePolicy[];
  myRequests: LeaveRequest[];
  myBalances: LeaveBalance[];
  pendingRequests: (LeaveRequest & { teacher?: { name: string } })[];
  teachers: Array<{ id: string; name: string; branch_id: string | null }>;
};

export function LeaveShell({
  role: _role,
  isReviewer,
  currentTeacherId,
  activeSchoolYear,
  policies,
  myRequests,
  myBalances,
  pendingRequests,
  teachers,
}: Props) {
  const [applyOpen, setApplyOpen] = useState(false);
  const [reviewingRequest, setReviewingRequest] = useState<(LeaveRequest & { teacher?: { name: string } }) | null>(
    null
  );
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const currentTeacher = teachers.find((t) => t.id === currentTeacherId) ?? null;

  async function handleCancel(id: string) {
    setCancellingId(id);
    try {
      const result = await cancelLeaveRequest(id);
      if (result?.error) {
        toast.error("Could not cancel", { description: result.error });
      } else {
        toast.success("Leave request cancelled");
        window.location.reload();
      }
    } finally {
      setCancellingId(null);
    }
  }

  if (!activeSchoolYear) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
        <Plane className="size-10 text-muted-foreground" />
        <p className="font-medium">No active school year</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Leave</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Apply for leave and track your requests for {activeSchoolYear.name}.
          </p>
        </div>
        <Button onClick={() => setApplyOpen(true)} className="gap-2" disabled={policies.length === 0}>
          <Plus className="size-4" />
          Apply for leave
        </Button>
      </div>

      {policies.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {policies.map((policy) => {
            const balance = myBalances.find((b) => b.leave_type === policy.leave_type);
            const used = balance?.used_days ?? 0;
            return (
              <div key={policy.id} className="rounded-lg border border-border p-4 bg-card">
                <p className="text-xs text-muted-foreground uppercase font-medium">{policy.name}</p>
                <p className="text-2xl font-semibold mt-1">
                  {Math.max(policy.days_allowed - used, 0)}
                  <span className="text-sm font-normal text-muted-foreground"> / {policy.days_allowed} left</span>
                </p>
              </div>
            );
          })}
        </div>
      )}

      {isReviewer && pendingRequests.length > 0 && (
        <div className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold">Pending approvals ({pendingRequests.length})</h2>
          <div className="border border-border rounded-lg overflow-hidden overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-b">
                  <TableHead>ID</TableHead>
                  <TableHead>TEACHER</TableHead>
                  <TableHead>TYPE</TableHead>
                  <TableHead>DATES</TableHead>
                  <TableHead>DAYS</TableHead>
                  <TableHead>REASON</TableHead>
                  <TableHead className="w-32">ACTIONS</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingRequests.map((req) => (
                  <TableRow key={req.id} className="hover:bg-muted/30">
                    <TableCell>
                      <code className="text-[11px] text-muted-foreground font-mono">{req.display_id}</code>
                    </TableCell>
                    <TableCell className="text-sm font-medium">{req.teacher?.name ?? "—"}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-xs font-normal capitalize">
                        {req.leave_type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatDateOnly(req.from_date)} → {formatDateOnly(req.to_date)}
                    </TableCell>
                    <TableCell className="text-sm">{req.total_days}</TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">
                      {req.reason}
                    </TableCell>
                    <TableCell>
                      <Button size="sm" variant="outline" onClick={() => setReviewingRequest(req)}>
                        Review
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">My requests</h2>
        <div className="border border-border rounded-lg overflow-hidden">
          {myRequests.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
              <Plane className="size-10 text-muted-foreground" />
              <div>
                <p className="font-medium">No leave requests yet</p>
                <p className="text-sm text-muted-foreground">Apply for leave using the button above</p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-b">
                    <TableHead>ID</TableHead>
                    <TableHead>TYPE</TableHead>
                    <TableHead>DATES</TableHead>
                    <TableHead>DAYS</TableHead>
                    <TableHead>STATUS</TableHead>
                    <TableHead className="w-24">ACTIONS</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {myRequests.map((req) => (
                    <TableRow key={req.id} className="hover:bg-muted/30">
                      <TableCell>
                        <code className="text-[11px] text-muted-foreground font-mono">{req.display_id}</code>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-xs font-normal capitalize">
                          {req.leave_type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {formatDateOnly(req.from_date)} → {formatDateOnly(req.to_date)}
                      </TableCell>
                      <TableCell className="text-sm">{req.total_days}</TableCell>
                      <TableCell>
                        <Badge className={`text-xs font-normal capitalize ${STATUS_COLORS[req.status]}`}>
                          {req.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {req.status === "pending" && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-xs text-muted-foreground hover:text-destructive"
                            disabled={cancellingId === req.id}
                            onClick={() => handleCancel(req.id)}
                          >
                            Cancel
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>

      {applyOpen && (
        <LeaveApplyPanel
          teacherId={currentTeacherId}
          branchId={currentTeacher?.branch_id ?? null}
          schoolYearId={activeSchoolYear.id}
          policies={policies}
          onClose={() => setApplyOpen(false)}
        />
      )}

      {reviewingRequest && (
        <SubstitutionPanel
          request={reviewingRequest}
          reviewerId={currentTeacherId}
          onClose={() => setReviewingRequest(null)}
        />
      )}
    </div>
  );
}
