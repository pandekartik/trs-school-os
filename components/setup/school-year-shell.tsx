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
import { Loader2, Plus, Trash2, Pencil, Calendar } from "lucide-react";
import { toast } from "sonner";
import { SchoolYearPanel } from "./school-year-panel";
import type { SchoolYear } from "@/lib/types";
import { deleteSchoolYear, setActiveSchoolYear } from "@/lib/actions/setup";

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

type Props = {
  schoolYears: SchoolYear[];
};

export function SchoolYearShell({ schoolYears }: Props) {
  const [panelOpen, setPanelOpen] = useState(false);
  const [panelMode, setPanelMode] = useState<"add" | "edit">("add");
  const [selectedYear, setSelectedYear] = useState<SchoolYear | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [yearToDelete, setYearToDelete] = useState<SchoolYear | null>(null);
  const [deleting, setDeleting] = useState(false);

  function handleAddYear() {
    setSelectedYear(null);
    setPanelMode("add");
    setPanelOpen(true);
  }

  function handleEditYear(year: SchoolYear) {
    setSelectedYear(year);
    setPanelMode("edit");
    setPanelOpen(true);
  }

  function handleClose() {
    setPanelOpen(false);
    setSelectedYear(null);
    setPanelMode("add");
  }

  async function handleSetActive(year: SchoolYear) {
    try {
      const result = await setActiveSchoolYear(year.id);
      if (result?.error) {
        toast.error("Failed to set active year", { description: result.error });
      } else {
        toast.success(`${year.name} set as active`);
        window.location.reload();
      }
    } catch (err) {
      toast.error("Error setting active year");
    }
  }

  async function handleConfirmDelete() {
    if (!yearToDelete) return;

    setDeleting(true);
    try {
      const result = await deleteSchoolYear(yearToDelete.id);
      if (result?.error) {
        toast.error("Delete failed", { description: result.error });
      } else {
        toast.success(`${yearToDelete.name} deleted`);
        setDeleteDialogOpen(false);
        setYearToDelete(null);
        window.location.reload();
      }
    } catch (err) {
      toast.error("Error deleting year");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">School Years <span className="text-base font-normal text-muted-foreground">({schoolYears.length})</span></h1>
            <p className="text-sm text-muted-foreground mt-1">Manage academic years and their date ranges.</p>
          </div>
          <Button onClick={handleAddYear} className="gap-2">
            <Plus className="size-4" />
            Add school year
          </Button>
        </div>

        <div className="border border-border rounded-lg overflow-hidden">
          {schoolYears.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
              <Calendar className="size-10 text-muted-foreground" />
              <div>
                <p className="font-medium">No school years yet</p>
                <p className="text-sm text-muted-foreground">Add your first school year</p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-b">
                    <TableHead>ID</TableHead>
                    <TableHead>NAME</TableHead>
                    <TableHead>DATES</TableHead>
                    <TableHead>STATUS</TableHead>
                    <TableHead className="w-24">ACTIONS</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {schoolYears.map((year) => (
                    <TableRow key={year.id} className="hover:bg-muted/30">
                      <TableCell>
                        <code className="text-[11px] text-muted-foreground font-mono">{year.display_id}</code>
                      </TableCell>
                      <TableCell>
                        <p className="font-medium text-sm">{year.name}</p>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {formatDate(year.start_date)} → {formatDate(year.end_date)}
                      </TableCell>
                      <TableCell>
                        {year.is_active ? (
                          <Badge variant="default" className="gap-1.5 text-xs font-normal">
                            <span className="size-1.5 rounded-full bg-current" />
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs font-normal">
                            Archived
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {!year.is_active && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 px-2 text-xs"
                              onClick={() => handleSetActive(year)}
                            >
                              Set Active
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="size-8 p-0"
                            onClick={() => handleEditYear(year)}
                            title="Edit year"
                          >
                            <Pencil className="size-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="size-8 p-0 text-muted-foreground hover:text-destructive"
                            onClick={() => {
                              setYearToDelete(year);
                              setDeleteDialogOpen(true);
                            }}
                            title="Delete year"
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
        <SchoolYearPanel
          mode={panelMode}
          year={selectedYear}
          onClose={handleClose}
        />
      )}

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete School Year</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <span className="font-medium text-foreground">{yearToDelete?.name}</span>? This action cannot be undone.
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
              {deleting ? <><Loader2 className="size-4 animate-spin" />Deleting...</> : "Delete Year"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
