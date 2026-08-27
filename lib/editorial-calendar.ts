export type CalendarEventLike = {
  id: string;
  title: string;
  eventDate: Date;
  annual: boolean;
  leadDays: number;
};

export function nextOccurrence(event: CalendarEventLike, from = new Date()) {
  const start = new Date(from.getFullYear(), from.getMonth(), from.getDate());

  if (!event.annual) {
    const date = new Date(event.eventDate);
    return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12, 0, 0, 0);
  }

  const source = new Date(event.eventDate);
  let occurrence = new Date(start.getFullYear(), source.getMonth(), source.getDate(), 12, 0, 0, 0);
  if (occurrence < start) {
    occurrence = new Date(start.getFullYear() + 1, source.getMonth(), source.getDate(), 12, 0, 0, 0);
  }
  return occurrence;
}

export function calendarDaysUntil(date: Date, from = new Date()) {
  const start = new Date(from.getFullYear(), from.getMonth(), from.getDate(), 12, 0, 0, 0);
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12, 0, 0, 0);
  return Math.round((target.getTime() - start.getTime()) / 86400000);
}

export function sourceForCalendarDemand(eventId: string, occurrence: Date) {
  return `CALENDAR:${eventId}:${occurrence.getFullYear()}`;
}
