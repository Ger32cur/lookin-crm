import Link from 'next/link';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { AUTH_TOKEN_COOKIE } from '@/lib/auth';
import { getContacts } from '@/lib/contacts';

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

function displayName(firstName: string | null, lastName: string | null) {
  const name = [firstName, lastName].filter(Boolean).join(' ');
  return name.length > 0 ? name : 'Sin nombre';
}

export default async function ContactsPage() {
  const token = cookies().get(AUTH_TOKEN_COOKIE)?.value;
  if (!token) {
    redirect('/login');
  }

  const me = await getMe(token);
  if (!me) {
    redirect('/login');
  }

  const contactsResult = await getContacts(token);

  return (
    <main className="min-h-screen bg-slate-950 p-6 text-slate-100">
      <section className="mx-auto w-full max-w-5xl rounded-2xl border border-slate-800 bg-slate-900/80 p-8">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-indigo-300">Contacts</p>
            <h1 className="mt-2 text-3xl font-semibold">Contactos</h1>
            <p className="mt-1 text-sm text-slate-400">Organización: {me.organizationId}</p>
          </div>
          <Link
            href="/contacts/new"
            className="rounded-lg border border-indigo-400/40 bg-indigo-500/10 px-4 py-2 text-sm font-medium text-indigo-200 transition hover:bg-indigo-500/20"
          >
            New Contact
          </Link>
        </div>

        {contactsResult.items.length === 0 ? (
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-6 text-slate-300">
            No hay contactos todavía.
          </div>
        ) : (
          <div className="space-y-3">
            {contactsResult.items.map((contact) => (
              <article
                key={contact.id}
                className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 transition hover:border-slate-700"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold">{displayName(contact.firstName, contact.lastName)}</h2>
                    <p className="text-sm text-slate-300">{contact.email ?? 'Sin email'}</p>
                  </div>
                  <span className="text-xs text-slate-400">{new Date(contact.createdAt).toLocaleDateString()}</span>
                </div>
                {contact.phone ? <p className="mt-2 text-sm text-slate-300">Tel: {contact.phone}</p> : null}
                {contact.status ? <p className="mt-1 text-sm text-slate-400">Estado: {contact.status}</p> : null}
              </article>
            ))}
          </div>
        )}

        <div className="mt-8 flex gap-4">
          <Link className="text-indigo-300 underline-offset-4 hover:underline" href="/dashboard">
            Volver al dashboard
          </Link>
          <Link className="text-indigo-300 underline-offset-4 hover:underline" href="/login">
            Volver a login
          </Link>
        </div>
      </section>
    </main>
  );
}
