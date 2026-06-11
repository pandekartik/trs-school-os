"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, Plus, Trash2, Pencil, FileText, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";
import { LeavePolicyPanel } from "./leave-policy-panel";
import type { LeavePolicy, SchoolYear } from "@/lib/types";
import { deleteLeavePolicy } from "@/lib/actions/setup";

type Props = {
  policies: LeavePolicy[];
  activeYear: SchoolYear;
};

export function LeavePolicyShell({ policies, activeYear }: Props) {
  const [panelOpen, setPanelOpen] = useState(false);
  const [selectedPolicy, setSelectedPolicy] = useState<LeavePolicy | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [policyToDelete, setPolicyToDelete] = useState<LeavePolicy | null>(null);
  const [deleting, setDeleting] = useState(false);

  function handleAddPolicy() {
    setSelectedPolicy(null);
    setPanelOpen(true);
  }

  function handleEditPolicy(policy: LeavePolicy) {
    setSelectedPolicy(policy);
    setPanelOpen(true);
  }

  function handleClose() {
    setPanelOpen(false);
    setSelectedPolicy(null);
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

  return (
    <>
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Leave Policy</h1>
            <p className="text-sm text-muted-foreground mt-1">Configure leave types and quotas for {activeYear.name}.</p>
          </div>
          <Button onClick={handleAddPolicy} className="gap-2">
            <Plus className="size-4" />
            Add leave type
          </Button>
        </div>

        {policies.length === 0 && (
          <div className="px-4 py-3 rounded-lg bg-amber-50 border border-amber-200 text-sm text-amber-700">
            No leave policy configured for this school year. Add leave types to enable teacher leave applications.
          </div>
        )}

        <div className="border border-border rounded-lg overflow-hidden">
          <div className="bg-muted/50 border-b border-border px-4 py-3">
            <p className="text-sm font-medium">Leave types <span className="text-muted-foreground font-normal">({policies.length})</span></p>
          </div>

          {policies.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
              <FileText className="size-10 text-muted-foreground" />
              <div>
                <p className="font-medium">No leave types configured</p>
                <p className="text-sm text-muted-foreground">Add your first leave type above</p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-b">
                    <TableHead>LEAVE TYPE</TableHead>
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
                        <div className="flex flex-col gap-1">
                          <p className="font-medium text-sm">{policy.name}</p>
                          <code className="text-[11px] text-muted-foreground font-mono">{policy.leave_type}</code>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {policy.days_allowed} <span className="text-xs">days</span>
                      </TableCell>
                      <TableCell>
                        {policy.is_paid ? (
                          <CheckCircle className="size-4 text-success" />
                        ) : (
                          <XCircle className="size-4 text-muted-foreground" />
                        )}
                      </TableCell>
                      <TableCell>
                        {policy.requires_document ? (
                          <CheckCircle className="size-4 text-success" />
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="size-8 p-0"
                            onClick={() => handleEditPolicy(policy)}
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
          policy={selectedPolicy}
          activeYearId={activeYear.id}
          onClose={handleClose}
        />
      )}

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Leave Type</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <span className="font-medium text-foreground">{policyToDelete?.name}</span>? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={deleting}
            >
              {deleting ? <><Loader2 className="size-4 animate-spin" /> Deleting...</> : "Delete Type"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
