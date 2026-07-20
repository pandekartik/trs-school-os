import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { PERIOD_TIMES, TIMETABLE_DAYS, formatTimeLabel } from "@/lib/timetable-constants";

type TemplateSlot = {
  id: string;
  slot_type: string;
  display_order: number;
  label?: string | null;
};

type SlotCell = {
  subject_id: string;
  teacher_id: string;
} | undefined;

export function exportTimetableGridToPdf(params: {
  divisionLabel: string;
  timetableName: string;
  days: readonly string[];
  getTemplateSlotsForDay: (day: string) => TemplateSlot[];
  getCell: (templateSlotId: string, day: string) => SlotCell;
  getSubjectName: (subjectId: string) => string;
  getTeacherName: (teacherId: string) => string;
}) {
  const {
    divisionLabel,
    timetableName,
    days,
    getTemplateSlotsForDay,
    getCell,
    getSubjectName,
    getTeacherName,
  } = params;

  // Union of period display_orders across every day's template, so days with
  // different templates still line up in one grid.
  const orderSet = new Set<number>();
  const dayLabels: Record<string, string> = {};
  for (const day of days) {
    dayLabels[day] = day;
    for (const slot of getTemplateSlotsForDay(day)) {
      orderSet.add(slot.display_order);
    }
  }
  const orders = Array.from(orderSet).sort((a, b) => a - b);

  const head = ["Period", ...days.map((d) => dayLabels[d])];
  const body = orders.map((order) => {
    const periodTime = PERIOD_TIMES.find((p) => p.period === order);
    const periodLabel = periodTime
      ? `P${order}\n${formatTimeLabel(periodTime.start)}-${formatTimeLabel(periodTime.end)}`
      : `P${order}`;

    const row = [periodLabel];
    for (const day of days) {
      const slot = getTemplateSlotsForDay(day).find((s) => s.display_order === order);
      if (!slot) {
        row.push("");
        continue;
      }
      const cell = getCell(slot.id, day);
      if (!cell) {
        row.push(slot.slot_type === "period" || slot.slot_type === "class" ? "" : (slot.label ?? ""));
        continue;
      }
      row.push(`${getSubjectName(cell.subject_id)}\n${getTeacherName(cell.teacher_id)}`);
    }
    return row;
  });

  const doc = new jsPDF({ orientation: "landscape" });
  doc.setFontSize(14);
  doc.text(`${timetableName} — ${divisionLabel}`, 14, 15);
  doc.setFontSize(9);
  doc.text(`Generated ${new Date().toLocaleDateString("en-IN")}`, 14, 21);

  autoTable(doc, {
    head: [head],
    body,
    startY: 26,
    styles: { fontSize: 8, cellPadding: 2, valign: "middle", halign: "center" },
    headStyles: { fillColor: [186, 32, 50] },
    columnStyles: { 0: { cellWidth: 28, halign: "left" } },
  });

  doc.save(`${timetableName}-${divisionLabel}.pdf`.replace(/\s+/g, "_"));
}

export { TIMETABLE_DAYS };
