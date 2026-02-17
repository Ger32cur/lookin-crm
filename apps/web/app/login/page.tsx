'use client';

import type { FormEvent } from 'react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Lock, Mail } from 'lucide-react';
import { setAuthToken } from '@/lib/auth';
import { getApiBaseUrl } from '@/lib/api-base-url';

type LoginResponse = {
  accessToken: string;
  user: {
    id: string;
    email: string;
    role: string;
    organizationId: string;
  };
};

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('admin@demo.local');
  const [password, setPassword] = useState('Admin12345!');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${getApiBaseUrl()}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        throw new Error('Invalid credentials');
      }

      const data: LoginResponse = await response.json();
      setAuthToken(data.accessToken);
      router.push('/dashboard');
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Unable to sign in');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-white via-[var(--brand-muted)] to-slate-100 p-6">
      <motion.section
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-[0_22px_70px_-24px_rgba(15,23,42,0.35)]"
      >
        <div className="mb-8 space-y-4 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--brand-primary)] text-2xl text-white">
            L
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Lookin CRM</p>
            <h1 className="mt-2 text-5xl text-[var(--brand-primary)]">Welcome Back</h1>
            <p className="mt-2 text-sm text-slate-600">Sign in to access your organization workspace.</p>
          </div>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <label className="block space-y-1.5">
            <span className="text-xs uppercase tracking-[0.14em] text-slate-500">Email</span>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-800 outline-none ring-[var(--brand-accent)] transition focus:ring-2"
                placeholder="admin@demo.local"
                required
              />
            </div>
          </label>

          <label className="block space-y-1.5">
            <span className="text-xs uppercase tracking-[0.14em] text-slate-500">Password</span>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-800 outline-none ring-[var(--brand-accent)] transition focus:ring-2"
                placeholder="••••••••"
                required
              />
            </div>
          </label>

          {error ? (
            <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-[var(--brand-accent)] px-4 py-2.5 text-sm font-semibold text-[var(--brand-primary)] transition hover:opacity-90 disabled:opacity-60"
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>
      </motion.section>
    </main>
  );
}
