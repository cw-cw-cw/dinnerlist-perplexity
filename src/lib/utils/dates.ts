const DEFAULT_TIMEZONE = "America/New_York";

export function formatEventDate(date: Date | string, timezone = DEFAULT_TIMEZONE): string {
  const d = new Date(date);
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric", timeZone: timezone,
  }).format(d);
}

export function formatEventTime(date: Date | string, timezone = DEFAULT_TIMEZONE): string {
  const d = new Date(date);
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric", minute: "2-digit", timeZone: timezone,
  }).format(d);
}

export function formatShortDate(date: Date | string, timezone = DEFAULT_TIMEZONE): string {
  const d = new Date(date);
  return new Intl.DateTimeFormat("en-US", {
    month: "short", day: "numeric", year: "numeric", timeZone: timezone,
  }).format(d);
}

export function formatDateTime(date: Date | string, timezone = DEFAULT_TIMEZONE): string {
  const d = new Date(date);
  return new Intl.DateTimeFormat("en-US", {
    month: "short", day: "numeric", year: "numeric",
    hour: "numeric", minute: "2-digit", timeZone: timezone,
  }).format(d);
}

export function formatDate(date: Date | string): string {
  return formatEventDate(date);
}

export function formatTime(date: Date | string): string {
  return formatEventTime(date);
}
