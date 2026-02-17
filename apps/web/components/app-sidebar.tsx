'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, BarChart3, Settings, KanbanSquare } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

type NavItem = {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
};

const navItems: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/contacts', label: 'Contacts', icon: Users },
  { href: '/pipeline', label: 'Pipeline', icon: KanbanSquare },
  { href: '/reports', label: 'Reports', icon: BarChart3 },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-40 w-64 border-r border-slate-800 bg-[var(--brand-primary)] px-4 py-6 text-white">
      <div className="mb-8 px-2">
        <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Lookin CRM</p>
        <h1 className="text-2xl text-white">Workspace</h1>
      </div>

      <nav className="space-y-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'relative flex items-center gap-3 overflow-hidden rounded-xl px-3 py-2 text-sm font-medium transition',
                isActive
                  ? 'bg-white/10 text-white'
                  : 'text-slate-300 hover:bg-white/5 hover:text-white',
              )}
            >
              {isActive ? (
                <motion.span
                  layoutId="active-nav"
                  className="absolute inset-y-1 left-1 w-1 rounded-full bg-[var(--brand-accent)]"
                  transition={{ type: 'spring', stiffness: 420, damping: 28 }}
                />
              ) : null}
              <Icon className="h-4 w-4" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
