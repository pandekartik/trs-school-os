"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { createTimeTemplate } from "@/lib/actions/timetable";
import { TemplateSlotEditor } from "./template-slot-editor";
import type { TemplateSlot, TimeTemplate } from "@/lib/types";

const DAYS = [
  { value: "monday", label: "Monday" },
  { value: "tuesday", label: "Tuesday" },
  { value: "wednesday", label: "Wednesday" },
  { value: "thursday", label: "Thursday" },
  { value: "friday", label: "Friday" },
  { value: "saturday", label: "Saturday" },
  { value: "sunday", label: "Sunday" },
];

export function TemplateWizard({
  open,
  onOpenChange,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}) {
  const [step, setStep] = useState<"form" | "slots">("form");
  const [loading, setLoading] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [createdTemplateId, setCreatedTemplateId] = useState<string | null>(null);
  const [createdTemplate, setCreatedTemplate] = useState<(TimeTemplate & { template_slot: TemplateSlot[] }) | null>(null);

  const handleDayToggle = (day: string) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const handleCreateTemplate = async () => {
    if (!templateName.trim()) {
      toast.error("Please enter a template name");
      return;
    }
    if (selectedDays.length === 0) {
      toast.error("Please select at least one day");
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.set("name", templateName);
    selectedDays.forEach((day) => formData.append("days", day));

    const result = await createTimeTemplate(formData);
    setLoading(false);

    if (result.error) {
      toast.error("Failed to create template", { description: result.error });
    } else {
      setCreatedTemplateId(result.id!);
      setCreatedTemplate({
        id: result.id,
        name: templateName,
        days: selectedDays,
        template_slot: [],
      });
      setStep("slots");
    }
  };

  const handleClose = () => {
    setStep("form");
    setTemplateName("");
    setSelectedDays([]);
    setCreatedTemplateId(null);
    setCreatedTemplate(null);
    onOpenChange(false);
    onSuccess?.();
  };

  if (step === "slots" && createdTemplate) {
    return (
      <TemplateSlotEditor
        template={createdTemplate}
        onClose={handleClose}
        isNew={true}
      />
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create Time Template</DialogTitle>
          <DialogDescription>
            Define your school's daily schedule template
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-xs font-medium">
              Template Name
            </Label>
            <Input
              id="name"
              placeholder="e.g. Standard Timetable"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-medium">Days</Label>
            <div className="grid grid-cols-2 gap-2">
              {DAYS.map((day) => (
                <button
                  key={day.value}
                  onClick={() => handleDayToggle(day.value)}
                  disabled={loading}
                  className={`px-3 py-2 text-xs rounded-md border transition-colors ${
                    selectedDays.includes(day.value)
                      ? "bg-gray-900 text-white border-gray-900"
                      : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  {day.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2 justify-end pt-4">
            <Button
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={loading}
              className="h-8 text-xs"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateTemplate}
              disabled={loading || !templateName.trim() || selectedDays.length === 0}
              className="h-8 text-xs"
            >
              {loading ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin mr-1" />
                  Creating...
                </>
              ) : (
                "Next"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
