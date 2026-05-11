"use client";

import { useState } from "react";
import { Standard, Division } from "@/lib/types";
import {
  createStandard, updateStandard, deleteStandard,
  createDivision, updateDivision, deleteDivision,
} from "@/lib/actions/setup";
import { useAction } from "@/lib/hooks/use-action";
import { EditableRow } from "@/components/shared/editable-row";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";

function EditStandardForm({ std }: { std: Standard }) {
  const action = useAction((fd) => updateStandard(std.id, fd), {
    successMessage: "Standard updated",
  });
  return (
    <form ref={action.formRef} action={action.execute} className="flex items-end gap-2">
      <div className="flex flex-col gap-1 flex-1">
        <Label>Name</Label>
        <Input name="name" defaultValue={std.name} className="h-7 text-xs" required />
      </div>
      <div className="flex flex-col gap-1 w-20">
        <Label>Grade</Label>
        <Input name="grade" type="number" defaultValue={std.grade} className="h-7 text-xs" required />
      </div>
      <Button type="submit" size="sm" className="h-7 text-xs" disabled={action.loading}>
        {action.loading ? <Loader2 className="h-3 w-3 animate-spin" /> : "Save"}
      </Button>
    </form>
  );
}

function EditDivisionForm({ div }: { div: Division }) {
  const action = useAction((fd) => updateDivision(div.id, fd), {
    successMessage: "Division updated",
  });
  return (
    <form ref={action.formRef} action={action.execute} className="flex items-end gap-2">
      <div className="flex flex-col gap-1 flex-1">
        <Label>Name</Label>
        <Input name="name" defaultValue={div.name} className="h-7 text-xs" required />
      </div>
      <Button type="submit" size="sm" className="h-7 text-xs" disabled={action.loading}>
        {action.loading ? <Loader2 className="h-3 w-3 animate-spin" /> : "Save"}
      </Button>
    </form>
  );
}

export function StandardsTab({
  standards,
  divisions,
}: {
  standards: Standard[];
  divisions: Division[];
}) {
  const [selectedStandard, setSelectedStandard] = useState(standards[0]?.id ?? "");
  const stdAction = useAction(createStandard, { successMessage: "Standard created" });
  const divAction = useAction(createDivision, { successMessage: "Division created" });
  const currentDivisions = divisions.filter((d) => d.standard_id === selectedStandard);

  async function handleDeleteStd(id: string) {
    const r = await deleteStandard(id);
    if (r?.error) toast.error("Delete failed", { description: r.error });
    else toast.success("Deleted");
  }

  async function handleDeleteDiv(id: string) {
    const r = await deleteDivision(id);
    if (r?.error) toast.error("Delete failed", { description: r.error });
    else toast.success("Deleted");
  }

  return (
    <div className="grid grid-cols-2 gap-4">
      {/* Standards */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Standards</CardTitle>
            {standards.length > 0 && (
              <Badge variant="outline" className="font-normal">{standards.length} standards</Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <form ref={stdAction.formRef} action={stdAction.execute} className="flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-2.5">
              <div className="flex flex-col gap-1.5">
                <Label>Name</Label>
                <Input name="name" placeholder="e.g. Std 1" required />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Grade</Label>
                <Input name="grade" type="number" min="1" max="12" placeholder="1" required />
              </div>
            </div>
            <Button type="submit" disabled={stdAction.loading} className="w-full">
              {stdAction.loading
                ? <><Loader2 className="h-3.5 w-3.5 animate-spin" />Adding...</>
                : <><Plus className="h-3.5 w-3.5" />Add standard</>
              }
            </Button>
          </form>

          {standards.length > 0 && (
            <>
              <div className="h-px bg-border my-4" />
              <div className="flex flex-col gap-1.5">
                {standards.map((std) => (
                  <EditableRow
                    key={std.id}
                    editForm={<EditStandardForm std={std} />}
                    onDelete={() => handleDeleteStd(std.id)}
                    className={selectedStandard === std.id ? "border-[color:var(--color-brand)] bg-[#fce8ea]/40" : ""}
                  >
                    <div
                      className="cursor-pointer"
                      onClick={() => setSelectedStandard(std.id)}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium">{std.name}</span>
                        <Badge variant="outline" className="text-[10px] h-4 px-1.5 font-normal">
                          Grade {std.grade}
                        </Badge>
                        <Badge variant="outline" className="text-[10px] h-4 px-1.5 font-normal">
                          {divisions.filter((d) => d.standard_id === std.id).length} div
                        </Badge>
                      </div>
                    </div>
                  </EditableRow>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Divisions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>
              Divisions
              {selectedStandard && (
                <span className="font-normal text-muted-foreground ml-1.5">
                  — {standards.find((s) => s.id === selectedStandard)?.name}
                </span>
              )}
            </CardTitle>
            {currentDivisions.length > 0 && (
              <Badge variant="outline" className="font-normal">{currentDivisions.length} divisions</Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <form ref={divAction.formRef} action={divAction.execute} className="flex flex-col gap-3">
            <input type="hidden" name="standard_id" value={selectedStandard} />
            <div className="flex flex-col gap-1.5">
              <Label>Standard</Label>
              <Select value={selectedStandard} onValueChange={setSelectedStandard}>
                <SelectTrigger><SelectValue placeholder="Select standard" /></SelectTrigger>
                <SelectContent>
                  {standards.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Division name</Label>
              <Input name="name" placeholder="e.g. A" required />
            </div>
            <Button type="submit" disabled={divAction.loading || !selectedStandard} className="w-full">
              {divAction.loading
                ? <><Loader2 className="h-3.5 w-3.5 animate-spin" />Adding...</>
                : <><Plus className="h-3.5 w-3.5" />Add division</>
              }
            </Button>
          </form>

          {currentDivisions.length > 0 && (
            <>
              <div className="h-px bg-border my-4" />
              <div className="flex flex-col gap-1.5">
                {currentDivisions.map((div) => (
                  <EditableRow
                    key={div.id}
                    editForm={<EditDivisionForm div={div} />}
                    onDelete={() => handleDeleteDiv(div.id)}
                  >
                    <span className="text-xs font-medium">Division {div.name}</span>
                  </EditableRow>
                ))}
              </div>
            </>
          )}

          {selectedStandard && currentDivisions.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-6">
              No divisions yet. Add one above.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}