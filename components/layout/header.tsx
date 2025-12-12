'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Cloud } from 'lucide-react';
import { MobileNav } from './mobile-nav';

const pageTitles: Record<string, string> = {
  '/': 'Dashboard',
  '/dns': 'DNS Management',
  '/tunnels': 'Tunnel Management',
  '/access': 'Access Management',
  '/access/policies': 'Access Policies',
};

function getPageTitle(pathname: string): string {
  // Exact match
  if (pageTitles[pathname]) {
    return pageTitles[pathname];
  }

  // Check for parent path match
  const segments = pathname.split('/').filter(Boolean);
  while (segments.length > 0) {
    const parentPath = '/' + segments.join('/');
    if (pageTitles[parentPath]) {
      return pageTitles[parentPath];
    }
    segments.pop();
  }

  return 'CF Manager';
}

export function Header() {
  const pathname = usePathname();
  const title = getPageTitle(pathname);

  return (
    <header className="h-16 border-b bg-background flex items-center px-4 md:px-6 gap-4">
      <MobileNav />
      <Link
        href="/"
        className="flex items-center gap-2 font-semibold md:hidden"
      >
        <Cloud className="h-5 w-5 text-primary" />
        <span className="text-sm">CF Manager</span>
      </Link>
      <div className="hidden md:block">
        <h1 className="text-xl font-semibold">{title}</h1>
      </div>
      <h1 className="text-lg font-semibold md:hidden ml-auto">{title}</h1>
    </header>
  );
}
