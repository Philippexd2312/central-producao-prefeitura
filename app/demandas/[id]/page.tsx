import Link from 'next/link';
import DemandWorkspace from '@/components/DemandWorkspace';
import { db } from '@/lib/db';
import { STATUS_LABELS } from '@/types/demand';
import { getCurrentUser, isManagerRole } from '@/lib/session';
import { UserRole } from '@prisma/client';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function DemandPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [demand, currentUser, team] = await Promise.all([
    db.demand.findUnique({
      where: { id },
      include: {
        department: true,
        assignee: true,
        members: { include: { user: true }, orderBy: { createdAt: 'asc' } },
        labels: { orderBy: { createdAt: 'asc' } },
        checklistItems: { orderBy: [{ position: 'asc' }, { createdAt: 'asc' }] },
        assets: { orderBy: { createdAt: 'desc' } },
        comments: { include: { author: true }, orderBy: { createdAt: 'desc' } },
        history: { include: { actor: true }, orderBy: { createdAt: 'desc' } },
      },
    }),
    getCurrentUser(),
    db.user.findMany({
      where: {
        active: true,
        role: { in: [UserRole.DESIGNER, UserRole.EDITOR, UserRole.COPYWRITER, UserRole.SOCIAL_MEDIA, UserRole.MANAGER] },
      },
      select: { id: true, name: true, role: true, availability: true },
      orderBy: { name: 'asc' },
    }),
  ]);

  if (!demand) notFound();

  const manager = currentUser ? isManagerRole(currentUser.role) : false;
  const member = currentUser ? demand.members.some(item => item.user.id === currentUser.id) : false;
  const canUseDelivery = Boolean(currentUser && (manager || demand.assigneeId === currentUser.id || member));

  return (
    <div className="page detailPageWide">
      {canUseDelivery && (
        <div className="deliveryEntryBar">
          <div><span>Produção & Entrega</span><small>Versões, aprovação e arquivo final</small></div>
          <Link href={`/demandas/${demand.id}/entrega`}>Abrir fluxo →</Link>
        </div>
      )}
      <DemandWorkspace
        manager={manager}
        team={team}
        demand={{
          id: demand.id,
          protocol: demand.protocol,
          title: demand.title,
          status: demand.status,
          statusLabel: STATUS_LABELS[demand.status] || demand.status,
          priority: demand.priority,
          type: demand.type,
          briefing: demand.briefing,
          revisedText: demand.revisedText,
          missingInfo: demand.missingInfo,
          originalText: demand.originalText,
          requesterName: demand.requesterName,
          requesterPhone: demand.requesterPhone,
          source: demand.source,
          startAt: demand.startAt?.toISOString() ?? null,
          dueAt: demand.dueAt?.toISOString() ?? null,
          coverUrl: demand.coverUrl,
          createdAt: demand.createdAt.toISOString(),
          department: demand.department ? { code: demand.department.code, name: demand.department.name } : null,
          assignee: demand.assignee ? { id: demand.assignee.id, name: demand.assignee.name } : null,
          members: demand.members.map(member => ({ id: member.user.id, name: member.user.name, role: member.user.role })),
          labels: demand.labels.map(label => ({ id: label.id, name: label.name, color: label.color })),
          checklistItems: demand.checklistItems.map(item => ({ id: item.id, text: item.text, completed: item.completed })),
          assets: demand.assets.map(asset => ({
            id: asset.id,
            name: asset.name,
            url: asset.url,
            mimeType: asset.mimeType,
            kind: asset.kind,
            createdAt: asset.createdAt.toISOString(),
          })),
          comments: demand.comments.map(comment => ({
            id: comment.id,
            text: comment.text,
            createdAt: comment.createdAt.toISOString(),
            author: comment.author ? { name: comment.author.name } : null,
          })),
          history: demand.history.map(item => ({
            id: item.id,
            action: item.action,
            fromValue: item.fromValue,
            toValue: item.toValue,
            createdAt: item.createdAt.toISOString(),
            actor: item.actor ? { name: item.actor.name } : null,
          })),
        }}
      />
    </div>
  );
}
