'use client';

import { usePathname } from 'next/navigation';
import { ThemeToggle } from './theme-toggle';
import { Bell, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSettings } from '@/store/useSettings';
import { useHealthCheck } from '@/lib/hooks';
import { Badge } from '@/components/ui/badge';

const pageTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/posts': 'Post Management',
  '/inbox': 'Messenger Inbox',
  '/analytics': 'Analytics',
  '/leads': 'Lead Management',
  '/system': 'System Monitor',
  '/settings': 'Settings',
};

export function Header() {
  const pathname = usePathname();
  const { toggleSidebar } = useSettings();
  const { data: health } = useHealthCheck();

  const title =
    Object.entries(pageTitles).find(([key]) => pathname.startsWith(key))?.[1] ||
    'Dashboard';

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-6">
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={toggleSidebar}
      >
        <Menu className="h-5 w-5" />
      </Button>

      <div className="flex-1">
        <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
      </div>

      <div className="flex items-center gap-2">
        {health?.success && (
          <Badge variant="success" className="hidden sm:flex gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse-dot" />
            API Online
          </Badge>
        )}

        <Button variant="ghost" size="icon" className="h-9 w-9 relative">
          <Bell className="h-4 w-4" />
        </Button>

        <ThemeToggle />
      </div>
    </header>
  );
}
