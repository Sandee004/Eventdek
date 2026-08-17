import type { EventItem } from "./types";

function toStamp(date: Date) {
  return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
}

function window_(event: EventItem) {
  const start = new Date(event.start);
  const end = new Date(start.getTime() + 3 * 3_600_000);
  return { start, end };
}

export function googleCalendarUrl(event: EventItem) {
  const { start, end } = window_(event);
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: event.title,
    dates: `${toStamp(start)}/${toStamp(end)}`,
    details: `${event.tagline}\n\nHosted by ${event.host.name} · via EventDek`,
    location: event.venue,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function icsFile(event: EventItem) {
  const { start, end } = window_(event);
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//EventDek//NG//EN",
    "BEGIN:VEVENT",
    `UID:${event.id}@eventdek`,
    `DTSTAMP:${toStamp(new Date())}`,
    `DTSTART:${toStamp(start)}`,
    `DTEND:${toStamp(end)}`,
    `SUMMARY:${event.title}`,
    `DESCRIPTION:${event.tagline}`,
    `LOCATION:${event.venue}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

export function downloadIcs(event: EventItem) {
  const blob = new Blob([icsFile(event)], {
    type: "text/calendar;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${event.id}.ics`;
  a.click();
  URL.revokeObjectURL(url);
}

export function mapsUrl(event: EventItem) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.venue)}`;
}
