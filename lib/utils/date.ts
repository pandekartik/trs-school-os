/**
 * Date-only strings (e.g. "2026-07-17" from a Postgres `date` column) must
 * not be passed to `new Date(str)` — the JS Date parser treats bare
 * "YYYY-MM-DD" as UTC midnight, which then renders as the previous day in
 * any timezone west of UTC. These helpers parse/format in local time.
 */

export function parseDateOnly(dateString: string): Date {
  const [year, month, day] = dateString.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function formatDateOnly(
  dateString: string,
  options: Intl.DateTimeFormatOptions = { day: "2-digit", month: "short" },
  locale: string = "en-US"
): string {
  return parseDateOnly(dateString).toLocaleDateString(locale, options);
}
