import type { ReactNode } from 'react';
import { AppSidebar } from '@/components/app-sidebar';
import { LogoutButton } from '@/components/logout-button';
import { requireSession } from '@/lib/session';

export default async function AppLayout({ children }: { children: ReactNode }) {
  const { user } = await requireSession();
  const avatarFallback = user.email.slice(0, 1).toUpperCase();

  return (
    <div className="min-h-screen bg-[var(--brand-muted)] text-[var(--brand-text)]">
      <AppSidebar />

      <div className="min-h-screen pl-0 md:pl-64">
        <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur">
          <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 md:px-6">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Organization</p>
              <p className="text-base text-slate-900">{user.organizationId}</p>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--brand-accent)] text-sm font-semibold text-[var(--brand-primary)]">
                {avatarFallback}
              </div>
              <div className="hidden text-sm text-slate-600 md:block">{user.email}</div>
              <LogoutButton />
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-7xl px-4 py-6 md:px-6 md:py-8">{children}</main>
      </div>
    </div>
  );
}
