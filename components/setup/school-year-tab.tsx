"use client";

import { SchoolYear } from "@/lib/types";
import {
  createSchoolYear, updateSchoolYear,
  deleteSchoolYear, setActiveSchoolYear,
} from "@/lib/actions/setup";
import { useAction } from "@/lib/hooks/use-action";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Loader2, Plus, Calendar, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useState, useRef } from "react";

function EditYearForm({
  year,
  onDone,
}: {
  year: SchoolYear;
  onDone: () => void;
}) {
  const action = useAction(
    (fd) => updateSchoolYear(year.id, fd),
    { successMessage: "Updated", onSuccess: onDone }
  );
  const [confirming, setConfirming] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setConfirming(true);
  };

  const handleConfirm = async () => {
    if (formRef.current) {
      const result = await action.submitFormData(new FormData(formRef.current));
      if (!result?.error) setConfirming(false);
    }
  };

  return (
    <>
      <form
        ref={formRef}
        onSubmit={handleSubmit}
        className="flex flex-col gap-4"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              name="name"
              defaultValue={year.name}
              required
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="start-date">Start date</Label>
            <Input
              id="start-date"
              name="start_date"
              type="date"
              defaultValue={year.start_date}
              required
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="end-date">End date</Label>
            <Input
              id="end-date"
              name="end_date"
              type="date"
              defaultValue={year.end_date}
              required
            />
          </div>
        </div>
        <div className="flex gap-3 pt-2">
          <Button type="submit" size="default">
            Save
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="default"
            onClick={onDone}
          >
            Cancel
          </Button>
        </div>
      </form>

      <AlertDialog open={confirming} onOpenChange={setConfirming}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Save changes?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to save the changes to this school year?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirm}
              disabled={action.loading}
            >
              {action.loading && <Loader2 className="animate-spin" />}
              Save
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

interface EditableRowProps {
  year: SchoolYear;
  onDelete: () => void;
}

function EditableYearRow({ year, onDelete }: EditableRowProps) {
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <TableRow>
        <TableCell colSpan={4} className="p-0">
          <div className="rounded-[var(--radius-card)] border border-brand-border bg-brand-light p-4 m-4">
            <EditYearForm year={year} onDone={() => setEditing(false)} />
          </div>
        </TableCell>
      </TableRow>
    );
  }

  return (
    <TableRow>
      <TableCell>{year.name}</TableCell>
      <TableCell>
        {year.start_date} → {year.end_date}
      </TableCell>
      <TableCell>
        {year.is_active ? (
          <Badge variant="success">Active</Badge>
        ) : (
          <Badge variant="secondary">Inactive</Badge>
        )}
      </TableCell>
      <TableCell className="text-right">
        <div className="flex shrink-0 items-center justify-end gap-2">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="xs"
                className="text-muted-foreground hover:text-foreground"
              >
                {year.is_active ? "Set Inactive" : "Set Active"}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  {year.is_active ? "Set Inactive?" : "Set Active?"}
                </AlertDialogTitle>
                <AlertDialogDescription>
                  {year.is_active
                    ? `Are you sure you want to set "${year.name}" as inactive?`
                    : `Are you sure you want to set "${year.name}" as the active school year?`}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={async () => {
                    await setActiveSchoolYear(year.id);
                    toast.success("Active year updated");
                  }}
                >
                  Confirm
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => setEditing(true)}
            title="Edit"
          >
            <Pencil />
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon-xs"
                className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                title="Delete"
              >
                <Trash2 />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete school year?</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete &quot;{year.name}&quot;? This action
                  cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => onDelete()}
                  className="bg-destructive hover:bg-error-hover"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </TableCell>
    </TableRow>
  );
}

export function SchoolYearTab({ schoolYears }: { schoolYears: SchoolYear[] }) {
  const syAction = useAction(createSchoolYear, {
    successMessage: "School year created",
  });
  const [confirmCreate, setConfirmCreate] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  async function handleDelete(id: string) {
    const result = await deleteSchoolYear(id);
    if (result?.error) toast.error("Delete failed", { description: result.error });
    else toast.success("Deleted");
  }

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setConfirmCreate(true);
  };

  const handleConfirmCreate = async () => {
    if (formRef.current) {
      const result = await syAction.submitFormData(new FormData(formRef.current));
      if (!result?.error) {
        setConfirmCreate(false);
        formRef.current.reset();
      }
    }
  };

  const sortedYears = [...schoolYears].sort((a, b) => {
    if (a.is_active === b.is_active) return 0;
    return a.is_active ? -1 : 1;
  });

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Create School Year</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            ref={formRef}
            onSubmit={handleCreateSubmit}
            className="flex flex-col gap-4"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="add-name">Name</Label>
                <Input
                  id="add-name"
                  name="name"
                  placeholder="e.g. 2026-27"
                  required
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="add-start">Start date</Label>
                <Input
                  id="add-start"
                  name="start_date"
                  type="date"
                  required
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="add-end">End date</Label>
                <Input
                  id="add-end"
                  name="end_date"
                  type="date"
                  required
                />
              </div>
            </div>
            <div className="flex pt-2">
              <Button
                type="submit"
                size="default"
                disabled={syAction.loading}
              >
                {syAction.loading && <Loader2 className="animate-spin" />}
                <Plus />
                Add School Year
              </Button>
            </div>
          </form>

          <AlertDialog open={confirmCreate} onOpenChange={setConfirmCreate}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Create school year?</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to create this new school year?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleConfirmCreate}
                  disabled={syAction.loading}
                >
                  {syAction.loading && <Loader2 className="animate-spin" />}
                  Create
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>

      {sortedYears.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>School Years</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Date Range</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedYears.map((year) => (
                  <EditableYearRow
                    key={year.id}
                    year={year}
                    onDelete={() => handleDelete(year.id)}
                  />
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {sortedYears.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 gap-4">
            <Calendar className="h-12 w-12 text-text-muted" />
            <div className="text-center">
              <p className="text-sm font-medium text-foreground">
                No school years yet
              </p>
              <p className="text-xs text-text-muted">
                Create your first school year above
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
