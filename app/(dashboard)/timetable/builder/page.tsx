import { redirect } from "next/navigation";

// This was an earlier, parallel implementation of the timetable builder
// (timetable_activation-based). /timetable (timetable-based) is the sole,
// sidebar-linked entry point going forward.
export default function TimetableBuilderPage() {
  redirect("/timetable");
}
