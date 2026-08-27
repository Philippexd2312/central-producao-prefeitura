'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function CalendarFloatingShortcut() {
  const pathname = usePathname();
  if (pathname === '/login' || pathname.startsWith('/login/') || pathname.startsWith('/calendario')) return null;

  return (
    <Link href="/calendario" className="calendarFloatingShortcut" aria-label="Abrir Calendário Editorial">
      <span>◷</span>
      <strong>Calendário</strong>
      <small>Datas & aniversários</small>
    </Link>
  );
}
