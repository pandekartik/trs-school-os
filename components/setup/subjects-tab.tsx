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
import { Loader2, Plus, Edit2, Trash2 } from "lucide-react";
import { toast } from "sonner";

function EditSubjectForm({ sub }: { sub: Subject }) {
  const action = useAction((fd) => updateSubject(sub.id, fd), {
    successMessage: "Subject updated",
  });
  return (
    <form onSubmit={action.handleSubmit} className="flex flex-col gap-2">
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
  const [showAddForm, setShowAddForm] = useState(false);
  const [hasChapters, setHasChapters] = useState("true");
  const [type, setType] = useState("academic");

  const subAction = useAction(createSubject, { successMessage: "Subject created" });
  const filtered = subjects.filter((s) => s.standard_id === selectedStandard);
  const selectedStandardData = standards.find((s) => s.id === selectedStandard);

  async function handleDelete(id: string) {
    const r = await deleteSubject(id);
    if (r?.error) toast.error("Delete failed", { description: r.error });
    else toast.success("Deleted");
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Pill Selector */}
      <div className="flex gap-2 flex-wrap">
        {standards.map((std) => (
          <button
            key={std.id}
            onClick={() => setSelectedStandard(std.id)}
            className={`px-4 py-1.5 rounded-full text-xs font-medium transition-colors ${
              selectedStandard === std.id
                ? "bg-gray-900 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {std.name}
          </button>
        ))}
      </div>

      {/* Subjects Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>
                {selectedStandardData?.name || "Subjects"}
              </CardTitle>
            </div>
            <div className="flex items-center gap-3">
              {filtered.length > 0 && (
                <Badge variant="outline" className="font-normal">{filtered.length}</Badge>
              )}
              <Button
                size="sm"
                className="h-8 text-xs"
                onClick={() => setShowAddForm(!showAddForm)}
              >
                <Plus className="h-3.5 w-3.5" />
                Add subject
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex flex-col gap-4">
          {/* Add Form - Inline (Shown when button clicked) */}
          {showAddForm && (
            <form onSubmit={subAction.handleSubmit} className="flex flex-col gap-3 pb-3 border-b border-gray-200">
              <input type="hidden" name="standard_id" value={selectedStandard} />
              <input type="hidden" name="has_chapters" value={hasChapters} />
              <input type="hidden" name="type" value={type} />

              <div className="grid grid-cols-5 gap-2">
                <div className="flex flex-col gap-1">
                  <Label className="text-xs">Subject name</Label>
                  <Input name="name" placeholder="e.g. English" className="h-8 text-xs" required />
                </div>
                <div className="flex flex-col gap-1">
                  <Label className="text-xs">Type</Label>
                  <Select value={type} onValueChange={setType}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="academic">Academic</SelectItem>
                      <SelectItem value="non_academic">Non-academic</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-1">
                  <Label className="text-xs">Periods/week</Label>
                  <Input name="periods_per_week" type="number" min="1" max="15" placeholder="6" className="h-8 text-xs" required />
                </div>
                <div className="flex flex-col gap-1">
                  <Label className="text-xs">Has chapters</Label>
                  <Select value={hasChapters} onValueChange={setHasChapters}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Yes</SelectItem>
                      <SelectItem value="false">No</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end gap-1">
                  <Button type="submit" disabled={subAction.loading || !selectedStandard} size="sm" className="h-8 text-xs">
                    {subAction.loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                  </Button>
                  <Button type="button" variant="ghost" size="sm" className="h-8 text-xs" onClick={() => setShowAddForm(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            </form>
          )}

          {filtered.length === 0 ? (
            <p className="text-xs text-gray-600 text-center py-6">
              {selectedStandard ? "No subjects yet." : "Select a standard first."}
            </p>
          ) : (
            <div className="flex flex-col gap-0 border border-gray-200 rounded-sm overflow-hidden">
              {/* Table Header */}
              <div className="grid grid-cols-5 gap-4 px-3 py-2 bg-gray-50 border-b border-gray-200 text-xs font-semibold uppercase text-gray-600">
                <div>Name</div>
                <div>Type</div>
                <div>Periods/week</div>
                <div>Has chapters</div>
                <div></div>
              </div>

              {/* Table Rows */}
              {filtered.map((sub) => (
                <EditableRow
                  key={sub.id}
                  editForm={<EditSubjectForm sub={sub} />}
                  onDelete={() => handleDelete(sub.id)}
                  className="grid grid-cols-5 gap-4 px-3 py-2.5 items-center border-b border-gray-100 last:border-b-0 hover:bg-gray-50"
                >
                  <div className="text-xs font-medium text-gray-900">{sub.name}</div>
                  <div>
                    <Badge
                      variant="outline"
                      className="text-[10px] h-5 px-2 font-normal"
                      style={{ color: "var(--color-brand)", borderColor: "var(--color-brand)" }}
                    >
                      {sub.type === "academic" ? "Academic" : "Non-academic"}
                    </Badge>
                  </div>
                  <div className="text-xs text-gray-600">{sub.periods_per_week}×/wk</div>
                  <div className="text-xs text-gray-600">{sub.has_chapters ? "Yes" : "No"}</div>
                  <div className="flex items-center gap-1 justify-end">
                    <Button variant="ghost" size="icon" className="h-6 w-6">
                      <Edit2 className="h-3.5 w-3.5 text-gray-600" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => handleDelete(sub.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5 text-gray-600" />
                    </Button>
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
