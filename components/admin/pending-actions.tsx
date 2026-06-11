"use client";

import { AlertTriangle, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import type { LeaveRequest } from "@/lib/types";

const leaveTypeBadgeColor: Record<string, string> = {
  sick: "bg-red-100 text-red-800",
  casual: "bg-blue-100 text-blue-800",
  emergency: "bg-amber-100 text-amber-800",
  official: "bg-purple-100 text-purple-800",
};

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
  });
}

type Props = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  pendingLeaves: (LeaveRequest & { teacher: any })[];
  totalPending: number;
};

export function PendingActions({ pendingLeaves, totalPending }: Props) {
  if (pendingLeaves.length === 0) {
    return null;
  }

  const showMore = totalPending > pendingLeaves.length;
  const moreCount = totalPending - pendingLeaves.length;

  return (
    <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-4">
      <div className="flex items-center gap-2 mb-3">
        <AlertTriangle className="size-5 text-amber-600" />
        <h3 className="font-semibold text-amber-900">Pending Actions</h3>
        <Badge variant="outline" className="ml-auto text-xs">
          {totalPending}
        </Badge>
      </div>

      <div className="space-y-2">
        {pendingLeaves.map((leave) => (
          <div
            key={leave.id}
            className="flex items-center justify-between rounded bg-white p-2.5 text-sm"
          >
            <div className="flex flex-1 items-center gap-3 min-w-0">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground truncate">
                  {leave.teacher?.name || "Unknown Teacher"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatDate(leave.from_date)} → {formatDate(leave.to_date)} ·{" "}
                  {leave.total_days}d
                </p>
              </div>
              <Badge
                className={`text-xs shrink-0 ${
                  leaveTypeBadgeColor[leave.leave_type]
                }`}
                variant="secondary"
              >
                {leave.leave_type}
              </Badge>
            </div>
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="gap-1 ml-2 shrink-0"
            >
              <Link href="/teacher/leave?tab=pending">
                Review
                <ChevronRight className="size-3" />
              </Link>
            </Button>
          </div>
        ))}
      </div>

      {showMore && (
        <div className="mt-3 pt-3 border-t border-amber-200">
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="text-xs text-amber-700 hover:text-amber-800"
          >
            <Link href="/teacher/leave?tab=pending">
              +{moreCount} more pending requests →
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
}
