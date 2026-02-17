import Link from 'next/link';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { AUTH_TOKEN_COOKIE } from '@/lib/auth';

type MeResponse = {
  id: string;
  email: string;
  role: string;
  organizationId: string;
};

async function getMe(token: string) {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/me`, {
    method: 'GET',
    cache: 'no-store',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    return null;
  }

  const data: MeResponse = await response.json();
  return data;
}

export default async function DashboardPage() {
  const token = cookies().get(AUTH_TOKEN_COOKIE)?.value;

  if (!token) {
    redirect('/login');
  }

  const me = await getMe(token);

  if (!me) {
    redirect('/login');
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 p-6 text-slate-100">
      <section className="w-full max-w-2xl rounded-2xl border border-slate-800 bg-slate-900/80 p-8">
        <p className="text-xs uppercase tracking-[0.2em] text-indigo-300">Dashboard</p>
        <h1 className="mt-2 text-3xl font-semibold">Hola, {me.email}</h1>
        <p className="mt-3 text-slate-300">
          Rol: <span className="font-medium text-white">{me.role}</span>
        </p>
        <p className="text-slate-300">
          Organization ID: <span className="font-medium text-white">{me.organizationId}</span>
        </p>
        <Link
          className="mt-6 inline-block rounded-lg border border-indigo-400/40 bg-indigo-500/10 px-4 py-2 text-sm font-medium text-indigo-200 transition hover:bg-indigo-500/20"
          href="/contacts"
        >
          Ver contactos
        </Link>
        <Link className="mt-6 inline-block text-indigo-300 underline-offset-4 hover:underline" href="/login">
          Volver a login
        </Link>
      </section>
    </main>
  );
}
