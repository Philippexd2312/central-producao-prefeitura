import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/session';

export const dynamic = 'force-dynamic';

export default async function MyDashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  redirect(`/equipe/${user.id}`);
}
