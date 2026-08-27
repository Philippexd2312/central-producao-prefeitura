import { redirect } from 'next/navigation';
import DepartmentManager from '@/components/DepartmentManager';
import { db } from '@/lib/db';
import { getCurrentUser, isManagerRole } from '@/lib/session';

export const dynamic = 'force-dynamic';

export default async function DepartmentsPage() {
  const current = await getCurrentUser();
  if (!current) redirect('/login');
  if (!isManagerRole(current.role)) redirect('/');

  const departments = await db.department.findMany({
    include: { _count: { select: { demands: true, calendarEvents: true } } },
    orderBy: [{ active: 'desc' }, { code: 'asc' }],
  });

  return (
    <div className="page departmentsPage">
      <DepartmentManager
        initialDepartments={departments.map(dep => ({
          id: dep.id,
          code: dep.code,
          name: dep.name,
          active: dep.active,
          demandCount: dep._count.demands,
          calendarCount: dep._count.calendarEvents,
        }))}
      />
    </div>
  );
}
