export function generateICSFile({
  title, description, location, startTime, endTime, url,
}: {
  title: string; description: string; location: string;
  startTime: Date; endTime?: Date; url?: string;
}): string {
  const formatDate = (date: Date): string => {
    return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  };

  const end = endTime || new Date(startTime.getTime() + 2 * 60 * 60 * 1000);

  const lines = [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//DinnerList//NONSGML v1.0//EN",
    "CALSCALE:GREGORIAN", "METHOD:PUBLISH", "BEGIN:VEVENT",
    `DTSTART:${formatDate(startTime)}`, `DTEND:${formatDate(end)}`,
    `SUMMARY:${escapeICS(title)}`, `DESCRIPTION:${escapeICS(description)}`,
    `LOCATION:${escapeICS(location)}`, url ? `URL:${url}` : "",
    "BEGIN:VALARM", "TRIGGER:-PT60M", "ACTION:DISPLAY",
    "DESCRIPTION:Reminder: Your dinner event is in 1 hour",
    "END:VALARM", "END:VEVENT", "END:VCALENDAR",
  ];

  return lines.filter(Boolean).join("\r\n");
}

function escapeICS(str: string): string {
  return str.replace(/[\\;,\n]/g, (match) => {
    switch (match) {
      case "\\": return "\\\\";
      case ";": return "\\;";
      case ",": return "\\,";
      case "\n": return "\\n";
      default: return match;
    }
  });
}

export function generateICS(event: {
  name: string; startTime: Date; endTime: Date | null;
  venueName: string | null; venueAddress: string | null;
  venueCity: string | null; venueState: string | null;
}): string {
  return generateICSFile({
    title: event.name,
    description: `Dinner event at ${event.venueName}`,
    location: [event.venueName, event.venueAddress, event.venueCity, event.venueState].filter(Boolean).join(", "),
    startTime: event.startTime,
    endTime: event.endTime ?? undefined,
  });
}
