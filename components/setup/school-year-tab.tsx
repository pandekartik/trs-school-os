"use client";

import { useState } from "react";
import { SchoolYear, Term } from "@/lib/types";
import {
  createSchoolYear,
  deleteTerm,
  createTerm,
  setActiveSchoolYear,
  deleteSchoolYear,
} from "@/lib/actions/setup";
import { useAction } from "@/lib/hooks/use-action";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ListItem } from "@/components/shared/list-item";
import { Loader2, Plus, CheckCircle } from "lucide-react";
import { toast } from "sonner";

export function SchoolYearTab({
  schoolYears,
  terms,
}: {
  schoolYears: SchoolYear[];
  terms: Term[];
}) {
  const [selectedYear, setSelectedYear] = useState<string>(
    schoolYears.find((y) => y.is_active)?.id ?? schoolYears[0]?.id ?? ""
  );

  const syAction = useAction(createSchoolYear, { successMessage: "School year created" });
  const termAction = useAction(createTerm, { successMessage: "Term created" });

  const activeYearTerms = terms.filter((t) => t.school_year_id === selectedYear);

  async function handleDelete(id: string, type: "year" | "term") {
    const fn = type === "year" ? deleteSchoolYear : deleteTerm;
    const result = await fn(id);
    if (result?.error) toast.error("Delete failed", { description: result.error });
    else toast.success(type === "year" ? "School year deleted" : "Term deleted");
  }

  return (
    <div className="grid grid-cols-2 gap-4">
      {/* School Years */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>School year</CardTitle>
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
                              className="h-6 w-6 rounded-md text-muted-foreground hover:text-green-700 hover:bg-green-50"
                              onClick={async () => {
                                await setActiveSchoolYear(year.id);
                                toast.success("Active year updated");
                              }}
                              title="Set as active"
                            >
                              <CheckCircle className="h-3 w-3" />
                            </Button>
                          )
                        }
                      </>
                    }
                    onDelete={() => handleDelete(year.id, "year")}
                  />
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Terms */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Terms</CardTitle>
            {activeYearTerms.length > 0 && (
              <Badge variant="outline" className="font-normal">
                {activeYearTerms.length} terms
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <form ref={termAction.formRef} action={termAction.execute} className="flex flex-col gap-3">
            <input type="hidden" name="school_year_id" value={selectedYear} />
            <div className="flex flex-col gap-1.5">
              <Label>School year</Label>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger>
                  <SelectValue placeholder="Select year" />
                </SelectTrigger>
                <SelectContent>
                  {schoolYears.map((y) => (
                    <SelectItem key={y.id} value={y.id}>{y.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="t-name">Term name</Label>
                <Input id="t-name" name="name" placeholder="Term 1" required />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="t-num">Number</Label>
                <Input id="t-num" name="term_number" type="number" min="1" max="4" placeholder="1" required />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="t-start">Start date</Label>
                <Input id="t-start" name="start_date" type="date" required />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="t-end">End date</Label>
                <Input id="t-end" name="end_date" type="date" required />
              </div>
            </div>
            <Button type="submit" disabled={termAction.loading || !selectedYear} className="w-full">
              {termAction.loading
                ? <><Loader2 className="h-3.5 w-3.5 animate-spin" />Adding...</>
                : <><Plus className="h-3.5 w-3.5" />Add term</>
              }
            </Button>
          </form>

          {activeYearTerms.length > 0 && (
            <>
              <div className="h-px bg-border my-4" />
              <div className="flex flex-col gap-1.5">
                {activeYearTerms.map((term) => (
                  <ListItem
                    key={term.id}
                    title={term.name}
                    subtitle={`${term.start_date} → ${term.end_date}`}
                    badges={
                      <Badge variant="outline" className="text-[10px] h-5 px-2 font-normal">
                        Term {term.term_number}
                      </Badge>
                    }
                    onDelete={() => handleDelete(term.id, "term")}
                  />
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
