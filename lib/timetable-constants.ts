export const PERIOD_TIMES = [
  { period: 1, start: "08:15", end: "08:50" },
  { period: 2, start: "08:50", end: "09:25" },
  { period: 3, start: "09:25", end: "10:00" },
  { period: 4, start: "10:00", end: "10:35" },
  { period: 5, start: "11:05", end: "11:40" },
  { period: 6, start: "11:40", end: "12:15" },
  { period: 7, start: "12:15", end: "12:50" },
  { period: 8, start: "12:50", end: "13:25" },
  { period: 9, start: "13:25", end: "14:00" },
] as const;

export const TIMETABLE_DAYS = ["MON", "TUE", "WED", "THU", "FRI"] as const;

export type TimetableDay = (typeof TIMETABLE_DAYS)[number];

export function getTodayIsoDate() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
  }).format(new Date());
}

export function formatTimeLabel(time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  const suffix = hours >= 12 ? "PM" : "AM";
  const normalizedHours = hours % 12 === 0 ? 12 : hours % 12;
  return `${String(normalizedHours).padStart(2, "0")}:${String(minutes).padStart(2, "0")} ${suffix}`;
}
