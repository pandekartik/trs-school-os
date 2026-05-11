"use client";

import { useState } from "react";
import { Subject, Standard } from "@/lib/types";
import {
  createSubject, updateSubject, deleteSubject,
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

function EditSubjectForm({ sub }: { sub: Subject }) {
  const action = useAction((fd) => updateSubject(sub.id, fd), {
    successMessage: "Subject updated",
  });
  return (
    <form ref={action.formRef} action={action.execute} className="flex flex-col gap-2">
      <div className="grid grid-cols-2 gap-2">
        <div className="flex flex-col gap-1">
          <Label>Name</Label>
          <Input name="name" defaultValue={sub.name} className="h-7 text-xs" required />
        </div>
        <div className="flex flex-col gap-1">
          <Label>Periods/week</Label>
          <Input name="periods_per_week" type="number" defaultValue={sub.periods_per_week} className="h-7 text-xs" required />
        </div>
      </div>
      <input type="hidden" name="type" value={sub.type} />
      <input type="hidden" name="has_chapters" value={String(sub.has_chapters)} />
      <Button type="submit" size="sm" className="h-7 text-xs w-fit" disabled={action.loading}>
        {action.loading ? <Loader2 className="h-3 w-3 animate-spin" /> : "Save"}
      </Button>
    </form>
  );
}

export function SubjectsTab({
  subjects, standards,
}: {
  subjects: Subject[];
  standards: Standard[];
}) {
  const [selectedStandard, setSelectedStandard] = useState(standards[0]?.id ?? "");
  const [hasChapters, setHasChapters] = useState("true");
  const [type, setType] = useState("academic");

  const subAction = useAction(createSubject, { successMessage: "Subject created" });
  const filtered = subjects.filter((s) => s.standard_id === selectedStandard);

  async function handleDelete(id: string) {
    const r = await deleteSubject(id);
    if (r?.error) toast.error("Delete failed", { description: r.error });
    else toast.success("Deleted");
  }

  return (
    <div className="grid grid-cols-2 gap-4">
      <Card>
        <CardHeader><CardTitle>Add subject</CardTitle></CardHeader>
        <CardContent>
          <form ref={subAction.formRef} action={subAction.execute} className="flex flex-col gap-3">
            <input type="hidden" name="standard_id" value={selectedStandard} />
            <input type="hidden" name="has_chapters" value={hasChapters} />
            <input type="hidden" name="type" value={type} />

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
              <Label>Subject name</Label>
              <Input name="name" placeholder="e.g. English" required />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div className="flex flex-col gap-1.5">
                <Label>Type</Label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="academic">Academic</SelectItem>
                    <SelectItem value="non_academic">Non-academic</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Periods / week</Label>
                <Input name="periods_per_week" type="number" min="1" max="15" placeholder="6" required />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>Has chapters?</Label>
              <Select value={hasChapters} onValueChange={setHasChapters}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Yes — content managed</SelectItem>
                  <SelectItem value="false">No — PT, Art, Library etc</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button type="submit" disabled={subAction.loading || !selectedStandard} className="w-full">
              {subAction.loading
                ? <><Loader2 className="h-3.5 w-3.5 animate-spin" />Adding...</>
                : <><Plus className="h-3.5 w-3.5" />Add subject</>
              }
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>
              Subjects
              {selectedStandard && (
                <span className="font-normal text-muted-foreground ml-1.5">
                  — {standards.find((s) => s.id === selectedStandard)?.name}
                </span>
              )}
            </CardTitle>
            {filtered.length > 0 && (
              <Badge variant="outline" className="font-normal">{filtered.length} subjects</Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-6">
              {selectedStandard ? "No subjects yet." : "Select a standard first."}
            </p>
          ) : (
            <div className="flex flex-col gap-1.5">
              {filtered.map((sub) => (
                <EditableRow
                  key={sub.id}
                  editForm={<EditSubjectForm sub={sub} />}
                  onDelete={() => handleDelete(sub.id)}
                >
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-medium">{sub.name}</span>
                    <Badge
                      variant="outline"
                      className="text-[10px] h-4 px-1.5 font-normal"
                      style={{ color: "var(--color-brand)", borderColor: "var(--color-brand)" }}
                    >
                      {sub.periods_per_week}×/wk
                    </Badge>
                    {!sub.has_chapters && (
                      <Badge variant="secondary" className="text-[10px] h-4 px-1.5 font-normal">
                        No chapters
                      </Badge>
                    )}
                  </div>
                </EditableRow>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}