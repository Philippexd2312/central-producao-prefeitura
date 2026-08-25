import DemandWorkspace from '@/components/DemandWorkspace';
import { db } from '@/lib/db';
import { STATUS_LABELS } from '@/types/demand';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function DemandPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const demand = await db.demand.findUnique({
    where: { id },
    include: {
      department: true,
      assignee: true,
      assets: { orderBy: { createdAt: 'desc' } },
      comments: { include: { author: true }, orderBy: { createdAt: 'desc' } },
      history: { include: { actor: true }, orderBy: { createdAt: 'desc' } },
    },
  });

  if (!demand) notFound();

  return (
    <div className="page detailPageWide">
      <DemandWorkspace
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
          dueAt: demand.dueAt?.toISOString() ?? null,
          createdAt: demand.createdAt.toISOString(),
          department: demand.department ? { code: demand.department.code, name: demand.department.name } : null,
          assignee: demand.assignee ? { name: demand.assignee.name } : null,
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
