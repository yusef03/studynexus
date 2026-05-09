/**
 * Semester utilities for StudyNexus.
 *
 * Supported format:
 *   "WS2024/25"  → Winter semester, starts Oct 1, 2024
 *   "SoSe2025"   → Summer semester, starts Mar 1, 2025
 */

/** Returns the start Date of a semester string. */
export function getSemesterStartDate(sem: string): Date {
  if (sem.startsWith("WS")) {
    const year = parseInt(sem.slice(2, 6), 10);
    return new Date(year, 9, 1); // October 1
  }
  // SoSe
  const year = parseInt(sem.slice(4), 10);
  return new Date(year, 2, 1); // March 1
}

/** Returns the current semester label based on today's date. */
export function getCurrentSemesterLabel(): string {
  const now = new Date();
  const month = now.getMonth() + 1; // 1-12
  const year = now.getFullYear();
  if (month >= 3 && month <= 9) {
    return `SoSe${year}`;
  }
  if (month >= 10) {
    return `WS${year}/${String(year + 1).slice(2)}`;
  }
  // Jan-Feb → belongs to WS of previous year
  return `WS${year - 1}/${String(year).slice(2)}`;
}

/**
 * Returns a human-readable label for a semester string.
 * "WS2024/25" → "WiSe 2024/25", "SoSe2025" → "SoSe 2025"
 */
export function formatSemesterLabel(sem: string, locale?: string): string {
  if (sem.startsWith("WS")) {
    const rest = sem.slice(2); // "2024/25"
    return locale === "en" ? `WS ${rest}` : `WiSe ${rest}`;
  }
  const year = sem.slice(4);
  return locale === "en" ? `SS ${year}` : `SoSe ${year}`;
}

/**
 * Calculates how many semester the student is currently in,
 * counting from start_semester (semester 1) up to today.
 * Returns 1 minimum (even if today is before the first semester starts).
 */
export function computeCurrentSemesterNumber(startSemester: string): number {
  const startDate = getSemesterStartDate(startSemester);
  const currentLabel = getCurrentSemesterLabel();
  const currentDate = getSemesterStartDate(currentLabel);

  if (currentDate < startDate) return 1;

  let count = 0;
  let d = new Date(startDate);
  while (d <= currentDate) {
    count++;
    const m = d.getMonth(); // 9=Oct, 2=Mar
    if (m === 9) {
      // WS → next SoSe is March next year
      d = new Date(d.getFullYear() + 1, 2, 1);
    } else {
      // SoSe → next WS is October same year
      d = new Date(d.getFullYear(), 9, 1);
    }
  }
  return count;
}

/**
 * Generates available semester options for the setup form.
 * Shows 4 past years + current + 1 future year, oldest first.
 */
export function generateSemesterOptions(): string[] {
  const now = new Date();
  const year = now.getFullYear();
  const options: string[] = [];

  for (let y = year - 3; y <= year + 1; y++) {
    options.push(`WS${y - 1}/${String(y).slice(2)}`);
    options.push(`SoSe${y}`);
  }
  return options;
}
