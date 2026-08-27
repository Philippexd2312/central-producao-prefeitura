import { notFound, redirect } from 'next/navigation';
import ProductionDelivery from '@/components/ProductionDelivery';
import { db } from '@/lib/db';
import { getCurrentUser, isManagerRole } from '@/lib/session';

export const dynamic = 'force-dynamic';

export default async function DeliveryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const current = await getCurrentUser();
  if (!current) redirect('/login');

  const demand = await db.demand.findUnique({
    where: { id },
    include: {
      department: true,
      assignee: true,
      members: { select: { userId: true } },
      versions: {
        include: { submittedBy: { select: { name: true } } },
        orderBy: { number: 'desc' },
      },
    },
  });
  if (!demand) notFound();

  const manager = isManagerRole(current.role);
  const canAccess = manager || demand.assigneeId === current.id || demand.members.some(member => member.userId === current.id);
  if (!canAccess) redirect(`/demandas/${id}`);

  return (
    <div className="page deliveryPage">
      <ProductionDelivery
        manager={manager}
        demand={{
          id: demand.id,
          protocol: demand.protocol,
          title: demand.title,
          status: demand.status,
          priority: demand.priority,
          dueAt: demand.dueAt?.toISOString() ?? null,
          approvedAt: demand.approvedAt?.toISOString() ?? null,
          deliveredAt: demand.deliveredAt?.toISOString() ?? null,
          department: demand.department ? { code: demand.department.code, name: demand.department.name } : null,
          assignee: demand.assignee ? { name: demand.assignee.name } : null,
          versions: demand.versions.map(version => ({
            id: version.id,
            number: version.number,
            name: version.name,
            url: version.url,
            mimeType: version.mimeType,
            note: version.note,
            final: version.final,
            createdAt: version.createdAt.toISOString(),
            submittedBy: version.submittedBy ? { name: version.submittedBy.name } : null,
          })),
        }}
      />
    </div>
  );
}
