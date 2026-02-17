import Link from 'next/link';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { AUTH_TOKEN_COOKIE } from '@/lib/auth';
import { createContact } from '@/lib/contacts';

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

  return (await response.json()) as MeResponse;
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

  async function submitContact(formData: FormData) {
    'use server';

    const currentToken = cookies().get(AUTH_TOKEN_COOKIE)?.value;
    if (!currentToken) {
      redirect('/login');
    }

    const firstName = String(formData.get('firstName') ?? '').trim();
    const lastName = String(formData.get('lastName') ?? '').trim();
    const email = String(formData.get('email') ?? '').trim();
    const phone = String(formData.get('phone') ?? '').trim();

    try {
      await createContact(currentToken, {
        firstName: firstName || undefined,
        lastName: lastName || undefined,
        email: email || undefined,
        phone: phone || undefined,
      });
    } catch {
      redirect('/contacts/new?error=create_failed');
    }

    redirect('/contacts');
  }

  return (
    <main className="min-h-screen bg-slate-950 p-6 text-slate-100">
      <section className="mx-auto w-full max-w-3xl rounded-2xl border border-slate-800 bg-slate-900/80 p-8">
        <p className="text-xs uppercase tracking-[0.2em] text-indigo-300">New Contact</p>
        <h1 className="mt-2 text-3xl font-semibold">Create contact</h1>
        <p className="mt-2 text-sm text-slate-400">
          Organización: <span className="text-slate-200">{me.organizationId}</span>
        </p>

        <form action={submitContact} className="mt-6 space-y-4">
          <label className="block">
            <span className="mb-1 block text-sm text-slate-300">First Name</span>
            <input
              type="text"
              name="firstName"
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none ring-indigo-400 transition focus:ring"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm text-slate-300">Last Name</span>
            <input
              type="text"
              name="lastName"
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none ring-indigo-400 transition focus:ring"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm text-slate-300">Email</span>
            <input
              type="email"
              name="email"
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none ring-indigo-400 transition focus:ring"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm text-slate-300">Phone</span>
            <input
              type="text"
              name="phone"
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none ring-indigo-400 transition focus:ring"
            />
          </label>

          <div className="flex gap-3">
            <button
              type="submit"
              className="rounded-lg border border-indigo-400/40 bg-indigo-500/10 px-4 py-2 text-sm font-medium text-indigo-200 transition hover:bg-indigo-500/20"
            >
              Save Contact
            </button>
            <Link
              href="/contacts"
              className="rounded-lg border border-slate-700 bg-slate-950 px-4 py-2 text-sm text-slate-200 transition hover:bg-slate-900"
            >
              Cancel
            </Link>
          </div>
        </form>
      </section>
    </main>
  );
}
