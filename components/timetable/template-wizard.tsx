"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, ChevronUp, ChevronDown, Trash2, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { createTimeTemplate, saveAllSlots } from "@/lib/actions/timetable";

const DAYS_SHORT = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

type SlotRow = {
  id: string;
  name: string;
  start_time: string;
  end_time: string;
  slot_type: "period" | "break" | "lunch" | "assembly";
  display_order: number;
};

export function TemplateWizard({
  open,
  onOpenChange,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [loading, setLoading] = useState(false);

  // Step 1
  const [templateName, setTemplateName] = useState("");
  const [selectedDays, setSelectedDays] = useState<string[]>([]);

  // Step 2
  const [periodCount, setPeriodCount] = useState("8");

  // Step 3
  const [slots, setSlots] = useState<SlotRow[]>([]);
  const [templateId, setTemplateId] = useState<string | null>(null);

  const handleDayToggle = (day: string) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const handleStep1Next = async () => {
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
      setTemplateId(result.id!);
      setStep(2);
    }
  };

  const handleStep2Next = () => {
    const periodNum = parseInt(periodCount, 10);
    if (isNaN(periodNum) || periodNum < 1 || periodNum > 12) {
      toast.error("Please enter a number between 1 and 12");
      return;
    }

    const newSlots: SlotRow[] = Array.from({ length: periodNum }, (_, i) => ({
      id: `new-${i}`,
      name: `Period ${i + 1}`,
      start_time: "",
      end_time: "",
      slot_type: "period" as const,
      display_order: i + 1,
    }));

    setSlots(newSlots);
    setStep(3);
  };

  const handleEditSlot = (
    index: number,
    field: keyof SlotRow,
    value: string | "period" | "break" | "lunch" | "assembly"
  ) => {
    const newSlots = [...slots];
    newSlots[index] = { ...newSlots[index], [field]: value };
    setSlots(newSlots);
  };

  const handleMoveSlot = (index: number, direction: "up" | "down") => {
    const newSlots = [...slots];
    const targetIndex = direction === "up" ? index - 1 : index + 1;

    if (targetIndex < 0 || targetIndex >= newSlots.length) return;

    [newSlots[index], newSlots[targetIndex]] = [
      newSlots[targetIndex],
      newSlots[index],
    ];

    newSlots.forEach((s, i) => (s.display_order = i + 1));
    setSlots(newSlots);
  };

  const handleDeleteSlot = (index: number) => {
    const newSlots = slots.filter((_, i) => i !== index);
    newSlots.forEach((s, i) => (s.display_order = i + 1));
    setSlots(newSlots);
  };

  const handleAddSlot = () => {
    const newSlot: SlotRow = {
      id: `new-${Date.now()}`,
      name: `Break`,
      start_time: "",
      end_time: "",
      slot_type: "break" as const,
      display_order: slots.length + 1,
    };
    setSlots([...slots, newSlot]);
  };

  const handleSaveTemplate = async () => {
    if (!templateId) return;

    const allFilled = slots.every((s) => s.name && s.start_time && s.end_time);
    if (!allFilled) {
      toast.error("Please fill in all slot fields");
      return;
    }

    const validTimes = slots.every((s) => s.start_time < s.end_time);
    if (!validTimes) {
      toast.error("Start time must be before end time");
      return;
    }

    setLoading(true);
    const result = await saveAllSlots(
      templateId,
      slots.map((s) => ({
        name: s.name,
        start_time: s.start_time,
        end_time: s.end_time,
        slot_type: s.slot_type,
        display_order: s.display_order,
      }))
    );
    setLoading(false);

    if (result.error) {
      toast.error("Failed to save template", { description: result.error });
    } else {
      toast.success("Template created successfully");
      handleClose();
    }
  };

  const handleClose = () => {
    setStep(1);
    setTemplateName("");
    setSelectedDays([]);
    setPeriodCount("8");
    setSlots([]);
    setTemplateId(null);
    onOpenChange(false);
    onSuccess?.();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-[10px] shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-8 py-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              Create Time Template
            </h2>
            <button
              onClick={handleClose}
              disabled={loading}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Step Indicator */}
          <div className="flex items-center gap-3">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center gap-3">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                    s === step
                      ? "bg-red-600 text-white"
                      : s < step
                        ? "bg-red-600 text-white"
                        : "bg-gray-200 text-gray-600"
                  }`}
                >
                  {s < step ? "✓" : s}
                </div>
                {s < 3 && (
                  <div
                    className={`w-12 h-0.5 ${
                      s < step ? "bg-red-600" : "bg-gray-200"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="px-8 py-6">
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Step 1 of 3 — Template basics
                </h3>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-medium text-gray-700">
                  TEMPLATE NAME
                </Label>
                <Input
                  placeholder="e.g. Morning Batch, Afternoon Batch, Saturday"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  disabled={loading}
                  className="h-9"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-medium text-gray-700">
                  APPLIES TO DAYS
                </Label>
                <div className="flex gap-2">
                  {DAYS_SHORT.map((day) => (
                    <button
                      key={day}
                      onClick={() => handleDayToggle(day.toLowerCase())}
                      disabled={loading}
                      className={`w-10 h-10 rounded text-xs font-medium transition-colors ${
                        selectedDays.includes(day.toLowerCase())
                          ? "bg-gray-900 text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  Step 2 of 3 — Period count
                </h3>
                <p className="text-sm text-gray-600">
                  How many teaching periods per day?
                </p>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-medium text-gray-700">
                  NUMBER OF PERIODS
                </Label>
                <Input
                  type="number"
                  min="1"
                  max="12"
                  value={periodCount}
                  onChange={(e) => setPeriodCount(e.target.value)}
                  disabled={loading}
                  className="h-9"
                />
                <p className="text-xs text-gray-500">
                  Breaks and lunch are added separately. Count only teaching
                  periods.
                </p>
              </div>

              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-900">
                  Your template will have{" "}
                  <strong>{periodCount || 8}</strong> teaching periods + any
                  breaks you add in the next step
                </p>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  Step 3 of 3 — Set slot times
                </h3>
                <p className="text-sm text-gray-600">
                  Define start time, end time, and type for each slot. Add
                  breaks between periods.
                </p>
              </div>

              {/* Slot Table */}
              <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                {slots.map((slot, index) => (
                  <div
                    key={slot.id}
                    className="flex items-center gap-2 p-3 border border-gray-200 rounded-md bg-white"
                  >
                    <div className="text-xs font-medium text-gray-500 w-6 text-center">
                      {slot.display_order}
                    </div>

                    <Input
                      value={slot.name}
                      onChange={(e) =>
                        handleEditSlot(index, "name", e.target.value)
                      }
                      placeholder="Slot name"
                      className="h-8 text-xs flex-1"
                    />

                    <Input
                      type="time"
                      value={slot.start_time}
                      onChange={(e) =>
                        handleEditSlot(index, "start_time", e.target.value)
                      }
                      className="h-8 text-xs w-20"
                    />

                    <span className="text-xs text-gray-400">—</span>

                    <Input
                      type="time"
                      value={slot.end_time}
                      onChange={(e) =>
                        handleEditSlot(index, "end_time", e.target.value)
                      }
                      className="h-8 text-xs w-20"
                    />

                    <Select
                      value={slot.slot_type}
                      onValueChange={(value) =>
                        handleEditSlot(
                          index,
                          "slot_type",
                          value as "period" | "break" | "lunch" | "assembly"
                        )
                      }
                    >
                      <SelectTrigger className="h-8 text-xs w-24">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="period">Period</SelectItem>
                        <SelectItem value="break">Break</SelectItem>
                        <SelectItem value="lunch">Lunch</SelectItem>
                        <SelectItem value="assembly">Assembly</SelectItem>
                      </SelectContent>
                    </Select>

                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleMoveSlot(index, "up")}
                        disabled={index === 0}
                      >
                        <ChevronUp className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleMoveSlot(index, "down")}
                        disabled={index === slots.length - 1}
                      >
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() => handleDeleteSlot(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              <Button
                variant="outline"
                className="w-full h-8 text-xs"
                onClick={handleAddSlot}
                disabled={loading}
              >
                <Plus className="h-3.5 w-3.5 mr-2" />
                Add Break or Extra Slot
              </Button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-8 py-4 flex gap-3 justify-end">
          {step > 1 && (
            <Button
              variant="ghost"
              className="h-8 text-xs"
              onClick={() => setStep((step - 1) as 1 | 2)}
              disabled={loading}
            >
              Back
            </Button>
          )}

          <Button
            variant="ghost"
            className="h-8 text-xs"
            onClick={handleClose}
            disabled={loading}
          >
            Cancel
          </Button>

          {step < 3 ? (
            <Button
              className="h-8 text-xs bg-red-600 hover:bg-red-700 text-white"
              onClick={step === 1 ? handleStep1Next : handleStep2Next}
              disabled={
                loading ||
                (step === 1 && (!templateName.trim() || selectedDays.length === 0))
              }
            >
              {loading ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin mr-2" />
                  Loading...
                </>
              ) : (
                "Next"
              )}
            </Button>
          ) : (
            <Button
              className="h-8 text-xs bg-red-600 hover:bg-red-700 text-white"
              onClick={handleSaveTemplate}
              disabled={loading || slots.length === 0}
            >
              {loading ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                "Save Template"
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
