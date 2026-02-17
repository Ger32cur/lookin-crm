import Link from 'next/link';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { Save, X } from 'lucide-react';
import { AUTH_TOKEN_COOKIE } from '@/lib/auth';
import { ApiRequestError, createContact } from '@/lib/contacts';
import { FormSubmitButton } from '@/components/ui/form-submit-button';
import { PageReveal } from '@/components/ui/page-reveal';

type NewContactPageProps = {
  searchParams?: {
    error?: string;
  };
};

export default async function NewContactPage({ searchParams }: NewContactPageProps) {
  const token = cookies().get(AUTH_TOKEN_COOKIE)?.value;
  if (!token) {
    redirect('/login');
  }

  async function createContactAction(formData: FormData) {
    'use server';

    const currentToken = cookies().get(AUTH_TOKEN_COOKIE)?.value;
    if (!currentToken) {
      redirect('/login');
    }

    const firstName = String(formData.get('firstName') ?? '').trim();
    const lastName = String(formData.get('lastName') ?? '').trim();
    const email = String(formData.get('email') ?? '').trim();
    const phone = String(formData.get('phone') ?? '').trim();
    const status = String(formData.get('status') ?? '').trim();

    try {
      await createContact(currentToken, {
        firstName: firstName || undefined,
        lastName: lastName || undefined,
        email: email || undefined,
        phone: phone || undefined,
        status: status || undefined,
      });
      redirect('/contacts');
    } catch (error) {
      if (error instanceof ApiRequestError && error.status === 401) {
        redirect('/login');
      }
      redirect('/contacts/new?error=create_failed');
    }
  }

  const hasError = searchParams?.error === 'create_failed';

  return (
    <PageReveal>
      <section className="mx-auto max-w-4xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Contacts</p>
            <h1 className="mt-1 text-4xl text-[var(--brand-primary)]">Create New Contact</h1>
          </div>
          <Link
            href="/contacts"
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            <X className="h-4 w-4" />
            Cancel
          </Link>
        </div>

        {hasError ? (
          <p className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            Unable to create contact. Please check the data and try again.
          </p>
        ) : null}

        <form action={createContactAction} className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-1.5">
              <span className="text-xs uppercase tracking-[0.14em] text-slate-500">First Name</span>
              <input
                type="text"
                name="firstName"
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none ring-[var(--brand-accent)] transition focus:ring-2"
                placeholder="Jane"
              />
            </label>

            <label className="space-y-1.5">
              <span className="text-xs uppercase tracking-[0.14em] text-slate-500">Last Name</span>
              <input
                type="text"
                name="lastName"
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none ring-[var(--brand-accent)] transition focus:ring-2"
                placeholder="Doe"
              />
            </label>

            <label className="space-y-1.5">
              <span className="text-xs uppercase tracking-[0.14em] text-slate-500">Email</span>
              <input
                type="email"
                name="email"
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none ring-[var(--brand-accent)] transition focus:ring-2"
                placeholder="jane@company.com"
              />
            </label>

            <label className="space-y-1.5">
              <span className="text-xs uppercase tracking-[0.14em] text-slate-500">Phone</span>
              <input
                type="text"
                name="phone"
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none ring-[var(--brand-accent)] transition focus:ring-2"
                placeholder="+1 555 234 6789"
              />
            </label>
          </div>

          <label className="space-y-1.5">
            <span className="text-xs uppercase tracking-[0.14em] text-slate-500">Status</span>
            <select
              name="status"
              defaultValue="lead"
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none ring-[var(--brand-accent)] transition focus:ring-2"
            >
              <option value="lead">Lead</option>
              <option value="qualified">Qualified</option>
              <option value="customer">Customer</option>
              <option value="lost">Lost</option>
            </select>
          </label>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <FormSubmitButton
              idleLabel="Save Contact"
              loadingLabel="Saving..."
              icon={<Save className="h-4 w-4" />}
              className="inline-flex items-center gap-2 rounded-lg bg-[var(--brand-accent)] px-5 py-2.5 text-sm font-semibold text-[var(--brand-primary)] transition hover:opacity-90 disabled:opacity-60"
            />
            <Link
              href="/contacts"
              className="rounded-lg border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Cancel
            </Link>
          </div>
        </form>
      </section>
    </PageReveal>
  );
}
