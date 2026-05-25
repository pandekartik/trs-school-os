"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Trash2, ChevronDown, ChevronUp, Plus, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { saveAllSlots, deleteTemplateSlot, addTemplateSlot } from "@/lib/actions/timetable";

interface TemplateSlot {
  id: string;
  template_id: string;
  name: string;
  start_time: string;
  end_time: string;
  slot_type: string;
  display_order: number;
  created_at?: string;
}

interface TimeTemplate {
  id: string;
  name: string;
  days: string[];
  template_slot?: TemplateSlot[];
}

export function TemplateSlotEditor({
  template,
  onClose,
  isNew = false,
}: {
  template: TimeTemplate;
  onClose: () => void;
  isNew?: boolean;
}) {
  const [slots, setSlots] = useState<TemplateSlot[]>(template.template_slot || []);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    start_time: "",
    end_time: "",
    slot_type: "period",
  });

  const handleSaveSlots = async () => {
    setLoading(true);
    const result = await saveAllSlots(
      template.id,
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
      toast.error("Failed to save slots", { description: result.error });
    } else {
      toast.success("Slots saved");
      if (isNew) onClose();
    }
  };

  const handleAddSlot = async () => {
    if (!formData.name || !formData.start_time || !formData.end_time) {
      toast.error("Please fill in all fields");
      return;
    }

    const newSlot: TemplateSlot = {
      id: `temp-${Date.now()}`,
      template_id: template.id,
      name: formData.name,
      start_time: formData.start_time,
      end_time: formData.end_time,
      slot_type: formData.slot_type,
      display_order: slots.length + 1,
    };

    setSlots([...slots, newSlot]);
    setFormData({
      name: "",
      start_time: "",
      end_time: "",
      slot_type: "period",
    });
    setShowAddForm(false);
  };

  const handleDeleteSlot = async (slotId: string) => {
    if (slotId.startsWith("temp-")) {
      setSlots(slots.filter((s) => s.id !== slotId));
    } else {
      setLoading(true);
      const result = await deleteTemplateSlot(slotId);
      setLoading(false);

      if (result.error) {
        toast.error("Failed to delete slot", { description: result.error });
      } else {
        setSlots(slots.filter((s) => s.id !== slotId));
      }
    }
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

  const handleEditSlot = (index: number, field: string, value: string) => {
    const newSlots = [...slots];
    newSlots[index] = { ...newSlots[index], [field]: value };
    setSlots(newSlots);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{template.name}</CardTitle>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Slots List */}
        {slots.length > 0 && (
          <div className="space-y-2">
            <Label className="text-xs font-medium">Periods/Slots</Label>
            <div className="space-y-2">
              {slots.map((slot, index) => (
                <div
                  key={slot.id}
                  className="flex items-center gap-2 p-3 border border-gray-200 rounded-md bg-white"
                >
                  <div className="flex flex-col gap-1 flex-1 min-w-0">
                    <Input
                      value={slot.name}
                      onChange={(e) =>
                        handleEditSlot(index, "name", e.target.value)
                      }
                      placeholder="Slot name"
                      className="h-7 text-xs"
                    />
                    <div className="flex gap-2">
                      <Input
                        type="time"
                        value={slot.start_time}
                        onChange={(e) =>
                          handleEditSlot(index, "start_time", e.target.value)
                        }
                        className="h-7 text-xs flex-1"
                      />
                      <span className="text-xs text-gray-500 self-center">—</span>
                      <Input
                        type="time"
                        value={slot.end_time}
                        onChange={(e) =>
                          handleEditSlot(index, "end_time", e.target.value)
                        }
                        className="h-7 text-xs flex-1"
                      />
                    </div>
                  </div>

                  <Select
                    value={slot.slot_type}
                    onValueChange={(value) =>
                      handleEditSlot(index, "slot_type", value)
                    }
                  >
                    <SelectTrigger className="h-7 text-xs w-24">
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
                      className="h-7 w-7"
                      onClick={() => handleMoveSlot(index, "up")}
                      disabled={index === 0}
                    >
                      <ChevronUp className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => handleMoveSlot(index, "down")}
                      disabled={index === slots.length - 1}
                    >
                      <ChevronDown className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive"
                      onClick={() => handleDeleteSlot(slot.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Add Slot Form */}
        {showAddForm && (
          <div className="space-y-2 p-3 border border-gray-200 rounded-md bg-gray-50">
            <div className="flex items-center justify-between mb-2">
              <Label className="text-xs font-medium">Add New Slot</Label>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => setShowAddForm(false)}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>

            <Input
              placeholder="Slot name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="h-8 text-xs"
            />

            <div className="flex gap-2">
              <Input
                type="time"
                value={formData.start_time}
                onChange={(e) =>
                  setFormData({ ...formData, start_time: e.target.value })
                }
                className="h-8 text-xs flex-1"
              />
              <span className="text-xs text-gray-500 self-center">—</span>
              <Input
                type="time"
                value={formData.end_time}
                onChange={(e) =>
                  setFormData({ ...formData, end_time: e.target.value })
                }
                className="h-8 text-xs flex-1"
              />
            </div>

            <Select
              value={formData.slot_type}
              onValueChange={(value) =>
                setFormData({ ...formData, slot_type: value })
              }
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="period">Period</SelectItem>
                <SelectItem value="break">Break</SelectItem>
                <SelectItem value="lunch">Lunch</SelectItem>
                <SelectItem value="assembly">Assembly</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex gap-2 justify-end">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={() => setShowAddForm(false)}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                className="h-7 text-xs"
                onClick={handleAddSlot}
              >
                Add
              </Button>
            </div>
          </div>
        )}

        {!showAddForm && (
          <Button
            variant="outline"
            className="w-full h-8 text-xs"
            onClick={() => setShowAddForm(true)}
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            Add Slot
          </Button>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 justify-end pt-4 border-t border-gray-200">
          <Button
            variant="ghost"
            className="h-8 text-xs"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            className="h-8 text-xs"
            onClick={handleSaveSlots}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="h-3 w-3 animate-spin mr-1" />
                Saving...
              </>
            ) : (
              "Save Template"
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
