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

export default async function NewContactPage() {
  const token = cookies().get(AUTH_TOKEN_COOKIE)?.value;

  if (!token) {
    redirect('/login');
  }

  const me = await getMe(token);
  if (!me) {
    redirect('/login');
  }

  async function createContact(formData: FormData) {
    'use server';

    const currentToken = cookies().get(AUTH_TOKEN_COOKIE)?.value;
    if (!currentToken) {
      redirect('/login');
    }

    const name = String(formData.get('name') ?? '').trim();
    const email = String(formData.get('email') ?? '').trim();
    const phone = String(formData.get('phone') ?? '').trim();
    const notes = String(formData.get('notes') ?? '').trim();

    if (!name || !email) {
      redirect('/dashboard/contacts/new?error=missing_fields');
    }

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/contacts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${currentToken}`,
      },
      body: JSON.stringify({
        name,
        email,
        phone: phone.length > 0 ? phone : undefined,
        notes: notes.length > 0 ? notes : undefined,
      }),
      cache: 'no-store',
    });

    if (response.status === 401) {
      redirect('/login');
    }

    if (!response.ok) {
      redirect('/dashboard/contacts/new?error=create_failed');
    }

    redirect('/dashboard/contacts');
  }

  return (
    <main className="min-h-screen bg-slate-950 p-6 text-slate-100">
      <section className="mx-auto w-full max-w-3xl rounded-2xl border border-slate-800 bg-slate-900/80 p-8">
        <p className="text-xs uppercase tracking-[0.2em] text-indigo-300">New Contact</p>
        <h1 className="mt-2 text-3xl font-semibold">Crear contacto</h1>
        <p className="mt-2 text-sm text-slate-400">
          Organización: <span className="text-slate-200">{me.organizationId}</span>
        </p>

        <form action={createContact} className="mt-6 space-y-4">
          <label className="block">
            <span className="mb-1 block text-sm text-slate-300">Nombre *</span>
            <input
              type="text"
              name="name"
              required
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none ring-indigo-400 transition focus:ring"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm text-slate-300">Email *</span>
            <input
              type="email"
              name="email"
              required
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none ring-indigo-400 transition focus:ring"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm text-slate-300">Teléfono</span>
            <input
              type="text"
              name="phone"
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none ring-indigo-400 transition focus:ring"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm text-slate-300">Notas</span>
            <textarea
              name="notes"
              rows={4}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none ring-indigo-400 transition focus:ring"
            />
          </label>

          <div className="flex gap-3">
            <button
              type="submit"
              className="rounded-lg border border-indigo-400/40 bg-indigo-500/10 px-4 py-2 text-sm font-medium text-indigo-200 transition hover:bg-indigo-500/20"
            >
              Guardar contacto
            </button>
            <Link
              href="/dashboard/contacts"
              className="rounded-lg border border-slate-700 bg-slate-950 px-4 py-2 text-sm text-slate-200 transition hover:bg-slate-900"
            >
              Cancelar
            </Link>
          </div>
        </form>
      </section>
    </main>
  );
}
