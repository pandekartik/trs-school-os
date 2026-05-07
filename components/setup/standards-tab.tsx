"use client";

import { useState } from "react";
import { Standard, Division } from "@/lib/types";
import { createStandard, deleteStandard, createDivision, deleteDivision } from "@/lib/actions/setup";
import { useAction } from "@/lib/hooks/use-action";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { ListItem } from "@/components/shared/list-item";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";

export function StandardsTab({
  standards,
  divisions,
}: {
  standards: Standard[];
  divisions: Division[];
}) {
  const [selectedStandard, setSelectedStandard] = useState<string>(standards[0]?.id ?? "");
  const stdAction = useAction(createStandard, { successMessage: "Standard created" });
  const divAction = useAction(createDivision, { successMessage: "Division created" });

  const currentDivisions = divisions.filter((d) => d.standard_id === selectedStandard);

  async function handleDelete(id: string, type: "standard" | "division") {
    const fn = type === "standard" ? deleteStandard : deleteDivision;
    const result = await fn(id);
    if (result?.error) toast.error("Delete failed", { description: result.error });
    else toast.success(type === "standard" ? "Standard deleted" : "Division deleted");
  }

  return (
    <div className="grid grid-cols-2 gap-4">
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
                <Label htmlFor="std-name">Name</Label>
                <Input id="std-name" name="name" placeholder="e.g. Std 1" required />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="std-grade">Grade</Label>
                <Input id="std-grade" name="grade" type="number" min="1" max="10" placeholder="1" required />
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
                  <ListItem
                    key={std.id}
                    title={std.name}
                    subtitle={`Grade ${std.grade}`}
                    highlighted={selectedStandard === std.id}
                    onClick={() => setSelectedStandard(std.id)}
                    badges={
                      <Badge variant="outline" className="text-[10px] h-5 px-2 font-normal">
                        {divisions.filter(d => d.standard_id === std.id).length} div
                      </Badge>
                    }
                    onDelete={() => handleDelete(std.id, "standard")}
                  />
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>
              Divisions
              {selectedStandard && (
                <span className="text-muted-foreground font-normal ml-1.5">
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
                <SelectTrigger>
                  <SelectValue placeholder="Select standard" />
                </SelectTrigger>
                <SelectContent>
                  {standards.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="div-name">Division name</Label>
              <Input id="div-name" name="name" placeholder="e.g. A" required />
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
                  <ListItem
                    key={div.id}
                    title={`Division ${div.name}`}
                    onDelete={() => handleDelete(div.id, "division")}
                  />
                ))}
              </div>
            </>
          )}

          {selectedStandard && currentDivisions.length === 0 && (
            <p className="text-xs text-muted-foreground mt-4 text-center py-4">
              No divisions yet. Add one above.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
