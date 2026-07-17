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
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, Plus, Trash2, Pencil, Plane } from "lucide-react";
import { toast } from "sonner";
import { LeavePolicyPanel } from "./leave-policy-panel";
import type { LeavePolicy, SchoolYear } from "@/lib/types";
import { deleteLeavePolicy } from "@/lib/actions/setup";

type Props = {
  policies: LeavePolicy[];
  activeSchoolYear: SchoolYear | null;
};

export function LeavePolicyShell({ policies, activeSchoolYear }: Props) {
  const [panelOpen, setPanelOpen] = useState(false);
  const [panelMode, setPanelMode] = useState<"add" | "edit">("add");
  const [selectedPolicy, setSelectedPolicy] = useState<LeavePolicy | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [policyToDelete, setPolicyToDelete] = useState<LeavePolicy | null>(null);
  const [deleting, setDeleting] = useState(false);

  function handleAdd() {
    setSelectedPolicy(null);
    setPanelMode("add");
    setPanelOpen(true);
  }

  function handleEdit(policy: LeavePolicy) {
    setSelectedPolicy(policy);
    setPanelMode("edit");
    setPanelOpen(true);
  }

  function handleClose() {
    setPanelOpen(false);
    setSelectedPolicy(null);
    setPanelMode("add");
  }

  async function handleConfirmDelete() {
    if (!policyToDelete) return;

    setDeleting(true);
    try {
      const result = await deleteLeavePolicy(policyToDelete.id);
      if (result?.error) {
        toast.error("Delete failed", { description: result.error });
      } else {
        toast.success(`${policyToDelete.name} deleted`);
        setDeleteDialogOpen(false);
        setPolicyToDelete(null);
        window.location.reload();
      }
    } catch {
      toast.error("Error deleting policy");
    } finally {
      setDeleting(false);
    }
  }

  if (!activeSchoolYear) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
        <Plane className="size-10 text-muted-foreground" />
        <div>
          <p className="font-medium">No active school year</p>
          <p className="text-sm text-muted-foreground">
            Set an active school year before configuring leave policies.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">
              Leave Policy <span className="text-base font-normal text-muted-foreground">({policies.length})</span>
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Leave types and allowances for {activeSchoolYear.name}.
            </p>
          </div>
          <Button onClick={handleAdd} className="gap-2" disabled={policies.length >= 4}>
            <Plus className="size-4" />
            Add leave policy
          </Button>
        </div>

        <div className="border border-border rounded-lg overflow-hidden">
          {policies.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
              <Plane className="size-10 text-muted-foreground" />
              <div>
                <p className="font-medium">No leave policies yet</p>
                <p className="text-sm text-muted-foreground">Add a leave type to get started</p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-b">
                    <TableHead>TYPE</TableHead>
                    <TableHead>NAME</TableHead>
                    <TableHead>DAYS ALLOWED</TableHead>
                    <TableHead>PAID</TableHead>
                    <TableHead>DOCUMENT REQUIRED</TableHead>
                    <TableHead className="w-24">ACTIONS</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {policies.map((policy) => (
                    <TableRow key={policy.id} className="hover:bg-muted/30">
                      <TableCell>
                        <Badge variant="secondary" className="text-xs font-normal capitalize">
                          {policy.leave_type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <p className="font-medium text-sm">{policy.name}</p>
                      </TableCell>
                      <TableCell className="text-sm">{policy.days_allowed} days</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {policy.is_paid ? "Paid" : "Unpaid"}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {policy.requires_document ? "Yes" : "No"}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="size-8 p-0"
                            onClick={() => handleEdit(policy)}
                            title="Edit policy"
                          >
                            <Pencil className="size-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="size-8 p-0 text-muted-foreground hover:text-destructive"
                            onClick={() => {
                              setPolicyToDelete(policy);
                              setDeleteDialogOpen(true);
                            }}
                            title="Delete policy"
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>

      {panelOpen && (
        <LeavePolicyPanel
          mode={panelMode}
          policy={selectedPolicy}
          schoolYearId={activeSchoolYear.id}
          onClose={handleClose}
        />
      )}

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Leave Policy</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <span className="font-medium text-foreground">{policyToDelete?.name}</span>? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleConfirmDelete} disabled={deleting}>
              {deleting ? <><Loader2 className="size-4 animate-spin" />Deleting...</> : "Delete Policy"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
