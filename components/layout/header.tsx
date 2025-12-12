'use client';

import { usePathname } from 'next/navigation';

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
    <header className="h-16 border-b bg-background flex items-center px-6">
      <h1 className="text-xl font-semibold">{title}</h1>
    </header>
  );
}
