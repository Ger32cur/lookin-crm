import Link from 'next/link';
import { cookies } from 'next/headers';
import { AUTH_TOKEN_COOKIE } from '@/lib/auth';
import { getContacts } from '@/lib/contacts';
import { PageReveal } from '@/components/ui/page-reveal';

export default async function DashboardPage() {
  const token = cookies().get(AUTH_TOKEN_COOKIE)?.value ?? '';
  const contacts = token ? await getContacts(token, { limit: 5, offset: 0 }) : null;

  return (
    <PageReveal className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Overview</p>
        <h1 className="mt-2 text-4xl text-[var(--brand-primary)]">Welcome to Lookin CRM</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-600">
          Manage your contacts, qualify leads and keep tenant-safe customer data for your organization.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
          <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Contacts</p>
          <p className="mt-2 text-3xl text-[var(--brand-primary)]">{contacts?.total ?? 0}</p>
          <p className="mt-1 text-sm text-slate-600">Registered in your pipeline</p>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
          <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Qualified</p>
          <p className="mt-2 text-3xl text-[var(--brand-primary)]">
            {contacts?.items.filter((item) => item.status === 'qualified').length ?? 0}
          </p>
          <p className="mt-1 text-sm text-slate-600">High intent opportunities</p>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
          <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Customers</p>
          <p className="mt-2 text-3xl text-[var(--brand-primary)]">
            {contacts?.items.filter((item) => item.status === 'customer').length ?? 0}
          </p>
          <p className="mt-1 text-sm text-slate-600">Converted accounts</p>
        </article>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Quick Actions</p>
            <h2 className="mt-1 text-2xl text-[var(--brand-primary)]">Start Working</h2>
          </div>
          <div className="flex gap-3">
            <Link
              href="/contacts"
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Open Contacts
            </Link>
            <Link
              href="/contacts/new"
              className="rounded-lg bg-[var(--brand-accent)] px-4 py-2 text-sm font-semibold text-[var(--brand-primary)] transition hover:opacity-90"
            >
              New Contact
            </Link>
          </div>
        </div>
      </section>
    </PageReveal>
  );
}
