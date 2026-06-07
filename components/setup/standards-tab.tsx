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
import { Loader2, Plus, Copy, Check } from "lucide-react";
import { toast } from "sonner";

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={handleCopy}
      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-100 rounded"
      title="Copy ID"
    >
      {copied ? (
        <Check className="h-3.5 w-3.5 text-green-600" />
      ) : (
        <Copy className="h-3.5 w-3.5 text-gray-400" />
      )}
    </button>
  );
}

function EditStandardForm({ std }: { std: Standard }) {
  const action = useAction((fd) => updateStandard(std.id, fd), {
    successMessage: "Standard updated",
  });
  return (
    <form onSubmit={action.handleSubmit} className="flex items-end gap-2">
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
    <form onSubmit={action.handleSubmit} className="flex items-end gap-2">
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
  const selectedStandardData = standards.find((s) => s.id === selectedStandard);

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
              <Badge variant="outline" className="font-normal">{standards.length}</Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {/* Add Form - Inline */}
          <form onSubmit={stdAction.handleSubmit} className="flex items-end gap-2">
            <div className="flex-1">
              <Label className="text-xs mb-1.5 block">Name</Label>
              <Input name="name" placeholder="e.g. Std 1" className="h-8 text-xs" required />
            </div>
            <div className="flex-1">
              <Label className="text-xs mb-1.5 block">Grade</Label>
              <Input name="grade" type="number" min="1" max="12" placeholder="1" className="h-8 text-xs" required />
            </div>
            <Button type="submit" disabled={stdAction.loading} size="sm" className="h-8 text-xs">
              {stdAction.loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
            </Button>
          </form>

          {standards.length > 0 && (
            <>
              <div className="h-px bg-gray-200" />
              <div className="flex flex-col gap-0 border border-gray-200 rounded-sm overflow-hidden">
                {standards.map((std) => (
                  <EditableRow
                    key={std.id}
                    editForm={<EditStandardForm std={std} />}
                    onDelete={() => handleDeleteStd(std.id)}
                    className={`border-b border-gray-100 last:border-b-0 bg-white px-0 py-0 rounded-none transition-colors cursor-pointer group ${
                      selectedStandard === std.id
                        ? "border-l-2 border-l-red-600 bg-red-50"
                        : "hover:bg-gray-50"
                    }`}
                  >
                    <div
                      className="flex items-center justify-between px-3 py-2.5 w-full"
                      onClick={() => setSelectedStandard(std.id)}
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <code className="text-[10px] text-gray-400 font-mono shrink-0 flex items-center gap-1">
                          {std.display_id}
                          <CopyButton value={std.display_id} />
                        </code>
                        <div className="text-xs font-medium text-gray-900">{std.name}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[10px] h-5 px-1.5 font-normal">
                          Grade {std.grade}
                        </Badge>
                        <Badge variant="outline" className="text-[10px] h-5 px-1.5 font-normal">
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
          <CardTitle>
            Divisions
            {selectedStandardData && (
              <span className="font-normal text-gray-600 ml-1.5">
                — {selectedStandardData.name}
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {selectedStandard ? (
            <>
              {/* Add Form - Inline */}
              <form onSubmit={divAction.handleSubmit} className="flex items-end gap-2">
                <input type="hidden" name="standard_id" value={selectedStandard} />
                <div className="flex-1">
                  <Label className="text-xs mb-1.5 block">Division name</Label>
                  <Input name="name" placeholder="e.g. A" className="h-8 text-xs" required />
                </div>
                <Button type="submit" disabled={divAction.loading} size="sm" className="h-8 text-xs">
                  {divAction.loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                </Button>
              </form>

              {currentDivisions.length > 0 && (
                <>
                  <div className="h-px bg-gray-200" />
                  <div className="flex flex-col gap-0 border border-gray-200 rounded-sm overflow-hidden">
                    {currentDivisions.map((div) => (
                      <EditableRow
                        key={div.id}
                        editForm={<EditDivisionForm div={div} />}
                        onDelete={() => handleDeleteDiv(div.id)}
                        className="border-b border-gray-100 last:border-b-0 bg-white px-0 py-0 rounded-none hover:bg-gray-50 group"
                      >
                        <div className="px-3 py-2.5 flex items-center gap-2">
                          <code className="text-[10px] text-gray-400 font-mono flex items-center gap-1">
                            {div.display_id}
                            <CopyButton value={div.display_id} />
                          </code>
                          <span className="text-xs font-medium text-gray-900">Division {div.name}</span>
                        </div>
                      </EditableRow>
                    ))}
                  </div>
                </>
              )}

              {currentDivisions.length === 0 && (
                <p className="text-xs text-gray-500 text-center py-6">No divisions yet. Add one above.</p>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <p className="text-sm text-gray-600">Select a standard from the left to manage its divisions</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
