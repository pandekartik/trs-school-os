"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, Plus, Trash2, Copy, MoreVertical, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { TemplateWizard } from "./template-wizard";
import { TemplateSlotEditor } from "./template-slot-editor";
import { deleteTimeTemplate, duplicateTimeTemplate } from "@/lib/actions/timetable";
import { TimeTemplate, TemplateSlot } from "@/lib/types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const DAY_ABBREVIATIONS: Record<string, string> = {
  monday: "Mon",
  tuesday: "Tue",
  wednesday: "Wed",
  thursday: "Thu",
  friday: "Fri",
  saturday: "Sat",
  sunday: "Sun",
};

export function TimeTemplatesShell({
  templates,
}: {
  templates: (TimeTemplate & { template_slot?: TemplateSlot[] })[];
}) {
  const [wizardOpen, setWizardOpen] = useState(false);
  const [expandedTemplateId, setExpandedTemplateId] = useState<string | null>(null);

  const expandedTemplate = templates.find((t) => t.id === expandedTemplateId);

  const handleDelete = async (id: string) => {
    const result = await deleteTimeTemplate(id);
    if (result.error) {
      toast.error("Failed to delete template", { description: result.error });
    } else {
      toast.success("Template deleted");
      if (expandedTemplateId === id) setExpandedTemplateId(null);
    }
  };

  const handleDuplicate = async (id: string) => {
    const result = await duplicateTimeTemplate(id);
    if (result.error) {
      toast.error("Failed to duplicate template", { description: result.error });
    } else {
      toast.success("Template duplicated");
    }
  };

  return (
    <div className="grid grid-cols-2 gap-6">
      {/* Left: Templates List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CardTitle>Time Templates</CardTitle>
              <Badge variant="outline" className="font-normal">
                {templates.length}
              </Badge>
            </div>
            <Button
              size="sm"
              className="h-8 text-xs"
              onClick={() => setWizardOpen(true)}
            >
              <Plus className="h-3.5 w-3.5" />
              New Template
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {templates.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <Clock className="h-10 w-10 text-gray-300" />
              <div className="text-center">
                <p className="text-sm font-medium text-gray-900">No templates yet</p>
                <p className="text-xs text-gray-600">Create your first time template</p>
              </div>
              <Button
                variant="secondary"
                size="sm"
                className="mt-2"
                onClick={() => setWizardOpen(true)}
              >
                New Template
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-0">
              {templates.map((template) => (
                <div
                  key={template.id}
                  className={`flex items-center justify-between px-4 py-3 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 cursor-pointer transition-colors ${
                    expandedTemplateId === template.id
                      ? "bg-red-50 border-l-2 border-l-red-600"
                      : ""
                  }`}
                >
                  <div
                    className="flex-1 min-w-0"
                    onClick={() => setExpandedTemplateId(template.id)}
                  >
                    <div className="text-sm font-medium text-gray-900 mb-1.5">
                      {template.name}
                    </div>
                    <div className="flex gap-1 flex-wrap">
                      {template.days.map((day) => (
                        <span
                          key={day}
                          className="inline-block bg-gray-100 text-gray-700 text-[10px] px-2 py-0.5 rounded"
                        >
                          {DAY_ABBREVIATIONS[day.toLowerCase()] || day}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    <Badge
                      variant="outline"
                      className="text-[10px] font-normal"
                    >
                      {template.template_slot?.length || 0} slots
                    </Badge>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDuplicate(template.id);
                          }}
                        >
                          <Copy className="h-4 w-4 mr-2" />
                          Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(template.id);
                          }}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>

                    <ChevronRight className="h-4 w-4 text-gray-400" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Right: Slot Viewer */}
      <div>
        {expandedTemplate ? (
          <TemplateSlotEditor
            template={expandedTemplate}
            onClose={() => setExpandedTemplateId(null)}
          />
        ) : (
          <Card className="h-full flex items-center justify-center min-h-96">
            <CardContent>
              <p className="text-sm text-gray-600 text-center">
                Select a template to view its slots
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Wizard Modal */}
      {wizardOpen && (
        <TemplateWizard
          open={wizardOpen}
          onOpenChange={setWizardOpen}
          onSuccess={() => setWizardOpen(false)}
        />
      )}
    </div>
  );
}
