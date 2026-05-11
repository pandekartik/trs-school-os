"use client";

import { SchoolYear } from "@/lib/types";
import {
  createSchoolYear, deleteSchoolYear, setActiveSchoolYear,
} from "@/lib/actions/setup";
import { useAction } from "@/lib/hooks/use-action";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ListItem } from "@/components/shared/list-item";
import { Loader2, Plus, CheckCircle } from "lucide-react";
import { toast } from "sonner";

export function SchoolYearTab({ schoolYears }: { schoolYears: SchoolYear[] }) {
  const syAction = useAction(createSchoolYear, { successMessage: "School year created" });

  async function handleDelete(id: string) {
    const result = await deleteSchoolYear(id);
    if (result?.error) toast.error("Delete failed", { description: result.error });
    else toast.success("School year deleted");
  }

  return (
    <div className="grid grid-cols-2 gap-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>School years</CardTitle>
            {schoolYears.length > 0 && (
              <Badge variant="outline" className="font-normal">
                {schoolYears.length} {schoolYears.length === 1 ? "year" : "years"}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <form ref={syAction.formRef} action={syAction.execute} className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="sy-name">Name</Label>
              <Input id="sy-name" name="name" placeholder="e.g. 2026-27" required />
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="sy-start">Start date</Label>
                <Input id="sy-start" name="start_date" type="date" required />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="sy-end">End date</Label>
                <Input id="sy-end" name="end_date" type="date" required />
              </div>
            </div>
            <Button type="submit" disabled={syAction.loading} className="w-full">
              {syAction.loading
                ? <><Loader2 className="h-3.5 w-3.5 animate-spin" />Adding...</>
                : <><Plus className="h-3.5 w-3.5" />Add school year</>
              }
            </Button>
          </form>

          {schoolYears.length > 0 && (
            <>
              <div className="h-px bg-border my-4" />
              <div className="flex flex-col gap-1.5">
                {schoolYears.map((year) => (
                  <ListItem
                    key={year.id}
                    title={year.name}
                    subtitle={`${year.start_date} → ${year.end_date}`}
                    highlighted={year.is_active}
                    badges={
                      <>
                        {year.is_active
                          ? <Badge className="text-[10px] h-5 px-2">Active</Badge>
                          : (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 rounded-md hover:text-green-700 hover:bg-green-50"
                              onClick={async () => {
                                await setActiveSchoolYear(year.id);
                                toast.success("Active year updated");
                              }}
                            >
                              <CheckCircle className="h-3 w-3" />
                            </Button>
                          )
                        }
                      </>
                    }
                    onDelete={() => handleDelete(year.id)}
                  />
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>About school years</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-3 text-sm text-muted-foreground">
            <p>
              A school year is the top-level container for all academic activity.
              Only one year can be active at a time.
            </p>
            <p>
              After creating the school year, go to the{" "}
              <span className="font-medium text-foreground">Segments</span> tab to define
              Unit 1, Term 1, Unit 2, and Term 2 for each standard separately.
            </p>
            <div className="rounded-lg border bg-secondary/40 p-3 text-xs">
              <p className="font-medium text-foreground mb-1">Recommended order</p>
              <ol className="list-decimal list-inside space-y-0.5">
                <li>Create school year here</li>
                <li>Add segments per standard</li>
                <li>Add standards &amp; divisions</li>
                <li>Add subjects per standard</li>
                <li>Add teachers</li>
              </ol>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}