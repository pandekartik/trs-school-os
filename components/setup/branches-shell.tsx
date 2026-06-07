"use client";

import { useState } from "react";
import type { Branch } from "@/lib/types";
import { createBranch, updateBranch, deleteBranch } from "@/lib/actions/setup";
import { useAction } from "@/lib/hooks/use-action";
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
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Plus, Trash2, Pencil, Building2 } from "lucide-react";
import { toast } from "sonner";
import { BranchPanel } from "./branch-panel";
import { cn } from "@/lib/utils";

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

type Props = {
  branches: Branch[];
};

export function BranchesShell({ branches }: Props) {
  const [panelOpen, setPanelOpen] = useState(false);
  const [panelMode, setPanelMode] = useState<"add" | "edit">("add");
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [branchToDelete, setBranchToDelete] = useState<Branch | null>(null);
  const [deleting, setDeleting] = useState(false);

  function handleAddBranch() {
    setSelectedBranch(null);
    setPanelMode("add");
    setPanelOpen(true);
  }

  function handleEditBranch(branch: Branch) {
    setSelectedBranch(branch);
    setPanelMode("edit");
    setPanelOpen(true);
  }

  function handleClose() {
    setPanelOpen(false);
    setSelectedBranch(null);
    setPanelMode("add");
  }

  async function handleConfirmDelete() {
    if (!branchToDelete) return;

    setDeleting(true);
    try {
      const result = await deleteBranch(branchToDelete.id);
      if (result?.error) {
        toast.error("Delete failed", { description: result.error });
      } else {
        toast.success(`${branchToDelete.name} deleted`);
        setDeleteDialogOpen(false);
        setBranchToDelete(null);
        window.location.reload();
      }
    } catch (err) {
      toast.error("Error deleting branch");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Branches <span className="text-base font-normal text-muted-foreground">({branches.length})</span></h1>
            <p className="text-sm text-muted-foreground mt-1">Manage school branches and locations.</p>
          </div>
          <Button onClick={handleAddBranch} className="gap-2">
            <Plus className="size-4" />
            Add branch
          </Button>
        </div>

        <div className="border border-border rounded-lg overflow-hidden">
          {branches.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
              <Building2 className="size-10 text-muted-foreground" />
              <div>
                <p className="font-medium">No branches yet</p>
                <p className="text-sm text-muted-foreground">Add your first branch</p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-b">
                    <TableHead>ID</TableHead>
                    <TableHead>BRANCH</TableHead>
                    <TableHead>STATUS</TableHead>
                    <TableHead>CREATED</TableHead>
                    <TableHead className="w-20">ACTIONS</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {branches.map((branch) => (
                    <TableRow key={branch.id} className="hover:bg-muted/30">
                      <TableCell>
                        <code className="text-[11px] text-muted-foreground font-mono">{branch.display_id}</code>
                      </TableCell>
                      <TableCell>
                        <div className="min-w-0">
                          <p className="font-medium text-sm">{branch.name}</p>
                          <p className="text-xs text-muted-foreground">{branch.city}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={branch.is_active ? "default" : "secondary"} className="text-xs font-normal">
                          {branch.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {formatDate(branch.created_at)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="size-8 p-0"
                            onClick={() => handleEditBranch(branch)}
                            title="Edit branch"
                          >
                            <Pencil className="size-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="size-8 p-0 text-muted-foreground hover:text-destructive"
                            onClick={() => {
                              setBranchToDelete(branch);
                              setDeleteDialogOpen(true);
                            }}
                            title="Delete branch"
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
        <BranchPanel
          mode={panelMode}
          branch={selectedBranch}
          onClose={handleClose}
        />
      )}

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Branch</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <span className="font-medium text-foreground">{branchToDelete?.name}</span>? This action cannot be undone.
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
              {deleting ? <><Loader2 className="size-4 animate-spin" />Deleting...</> : "Delete Branch"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
