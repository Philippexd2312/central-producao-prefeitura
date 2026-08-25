import { redirect } from 'next/navigation';
import { getCurrentUser, isManagerRole } from '@/lib/session';

export const dynamic = 'force-dynamic';

export default async function MyDashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (isManagerRole(user.role)) redirect('/');
  redirect(`/equipe/${user.id}`);
}
