'use client';

import { useRouter } from 'next/navigation';
import { clearAuthToken } from '@/lib/auth';

export function LogoutButton() {
  const router = useRouter();

  function handleLogout() {
    clearAuthToken();
    router.push('/login');
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
    >
      Logout
    </button>
  );
}
