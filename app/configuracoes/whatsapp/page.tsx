import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import WhatsAppSetup from '@/components/WhatsAppSetup';
import { getCurrentUser, isManagerRole } from '@/lib/session';

export const dynamic = 'force-dynamic';

export default async function WhatsAppSettingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (!isManagerRole(user.role)) redirect('/');

  const headerStore = await headers();
  const forwardedHost = headerStore.get('x-forwarded-host');
  const host = forwardedHost || headerStore.get('host') || 'central-producao-prefeitura-production.up.railway.app';
  const proto = headerStore.get('x-forwarded-proto') || 'https';
  const webhookUrl = `${proto}://${host}/api/webhooks/whatsapp`;

  return (
    <div className="page integrationPage">
      <WhatsAppSetup webhookUrl={webhookUrl} />
    </div>
  );
}
