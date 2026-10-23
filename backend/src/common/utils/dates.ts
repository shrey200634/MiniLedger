const DATE_ONLY_REGEX = /^\d{4}-\d{2}-\d{2}$/;

/** Calendar date (YYYY-MM-DD) of an instant, as seen in the given IANA time zone. */
export function toDateInTimeZone(instant: Date, timeZone: string): string {
  // The en-CA locale formats dates as YYYY-MM-DD.
  return new Intl.DateTimeFormat('en-CA', { timeZone }).format(instant);
}

/** True only for strict YYYY-MM-DD strings that are real calendar dates. */
export function isValidCalendarDate(value: unknown): value is string {
  if (typeof value !== 'string' || !DATE_ONLY_REGEX.test(value)) {
    return false;
  }
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

/** Date-only string to a UTC-midnight Date, for filtering @db.Date columns. */
export function toUtcMidnight(dateOnly: string): Date {
  return new Date(`${dateOnly}T00:00:00.000Z`);
}
