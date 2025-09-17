'use client';

import { useSession } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import Header from './Header';

export default function ClientHeader() {
  const { data: session } = useSession();
  const pathname = usePathname();

  if (pathname === '/login' || pathname === '/signup') {
    return null;
  }

  let userName: string | null = null;
  if (session?.user) {
    const user = session.user as any;
    if (user.firstName && user.lastName) {
      userName = `${user.firstName} ${user.lastName}`;
    } else if (user.firstName) {
      userName = user.firstName;
    } else if (user.email) {
      userName = user.email.split('@')[0];
    }
  }

  return <Header userName={userName} />;
}
