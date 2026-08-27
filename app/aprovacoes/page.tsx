import { DemandStatus } from '@prisma/client';
import { redirect } from 'next/navigation';
import ApprovalCenter from '@/components/ApprovalCenter';
import { db } from '@/lib/db';
import { getCurrentUser, isManagerRole } from '@/lib/session';

export const dynamic = 'force-dynamic';

export default async function ApprovalsPage() {
  const current = await getCurrentUser();
  if (!current) redirect('/login');
  if (!isManagerRole(current.role)) redirect('/');

  const demands = await db.demand.findMany({
    where: { status: DemandStatus.WAITING_APPROVAL },
    include: {
      department: { select: { code: true, name: true } },
      assignee: { select: { name: true } },
      versions: {
        include: { submittedBy: { select: { name: true } } },
        orderBy: { number: 'desc' },
        take: 1,
      },
    },
    orderBy: [{ dueAt: 'asc' }, { updatedAt: 'asc' }],
  });

  return (
    <div className="page approvalPage">
      <ApprovalCenter
        initialDemands={demands.map(demand => ({
          id: demand.id,
          protocol: demand.protocol,
          title: demand.title,
          priority: demand.priority,
          dueAt: demand.dueAt?.toISOString() ?? null,
          department: demand.department,
          assignee: demand.assignee,
          latestVersion: demand.versions[0] ? {
            id: demand.versions[0].id,
            number: demand.versions[0].number,
            name: demand.versions[0].name,
            url: demand.versions[0].url,
            mimeType: demand.versions[0].mimeType,
            note: demand.versions[0].note,
            createdAt: demand.versions[0].createdAt.toISOString(),
            submittedBy: demand.versions[0].submittedBy,
          } : null,
        }))}
      />
    </div>
  );
}
