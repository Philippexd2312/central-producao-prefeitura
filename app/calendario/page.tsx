import { redirect } from 'next/navigation';
import EditorialCalendar from '@/components/EditorialCalendar';
import { db } from '@/lib/db';
import { syncEditorialCalendarBase } from '@/lib/calendar-base';
import { calendarDaysUntil, nextOccurrence } from '@/lib/editorial-calendar';
import { getCurrentUser, isManagerRole } from '@/lib/session';

export const dynamic = 'force-dynamic';

export default async function CalendarPage() {
  const current = await getCurrentUser();
  if (!current) redirect('/login');

  await syncEditorialCalendarBase();

  const [events, departments] = await Promise.all([
    db.calendarEvent.findMany({
      where: { active: true },
      include: { department: { select: { id: true, code: true, name: true } } },
      orderBy: { title: 'asc' },
    }),
    db.department.findMany({ select: { id: true, code: true, name: true }, orderBy: { name: 'asc' } }),
  ]);

  const normalized = events
    .map(event => {
      const occurrence = nextOccurrence(event);
      return {
        id: event.id,
        title: event.title,
        description: event.description,
        type: event.type,
        eventDate: event.eventDate.toISOString(),
        annual: event.annual,
        leadDays: event.leadDays,
        personName: event.personName,
        personRole: event.personRole,
        department: event.department,
        nextOccurrence: occurrence.toISOString(),
        daysUntil: calendarDaysUntil(occurrence),
      };
    })
    .filter(event => event.daysUntil >= 0)
    .sort((a, b) => a.daysUntil - b.daysUntil);

  return (
    <div className="page calendarPage">
      <EditorialCalendar initialEvents={normalized} departments={departments} manager={isManagerRole(current.role)} />
    </div>
  );
}
