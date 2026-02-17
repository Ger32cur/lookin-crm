import Link from 'next/link';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { Search, Plus } from 'lucide-react';
import { AUTH_TOKEN_COOKIE } from '@/lib/auth';
import { ApiRequestError, type Contact, getContacts } from '@/lib/contacts';
import { PageReveal } from '@/components/ui/page-reveal';

type ContactsPageProps = {
  searchParams?: {
    q?: string;
    limit?: string;
    offset?: string;
  };
};

const STATUS_STYLES: Record<string, string> = {
  lead: 'bg-slate-100 text-slate-700 border-slate-200',
  qualified: 'bg-blue-100 text-blue-700 border-blue-200',
  customer: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  lost: 'bg-rose-100 text-rose-700 border-rose-200',
};

function displayName(contact: Contact) {
  const name = [contact.firstName, contact.lastName].filter(Boolean).join(' ');
  return name.length > 0 ? name : 'Unnamed Contact';
}

function badgeClass(status: string | null) {
  if (!status) {
    return 'bg-slate-100 text-slate-600 border-slate-200';
  }
  return STATUS_STYLES[status] ?? 'bg-zinc-100 text-zinc-700 border-zinc-200';
}

function toPositiveInteger(value: string | undefined, fallback: number) {
  if (!value) {
    return fallback;
  }

  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0) {
    return fallback;
  }

  return parsed;
}

function buildQuery(params: { q?: string; limit: number; offset: number }) {
  const search = new URLSearchParams();
  if (params.q) {
    search.set('q', params.q);
  }
  search.set('limit', String(params.limit));
  search.set('offset', String(params.offset));
  return `?${search.toString()}`;
}

export default async function ContactsPage({ searchParams }: ContactsPageProps) {
  const token = cookies().get(AUTH_TOKEN_COOKIE)?.value;
  if (!token) {
    redirect('/login');
  }

  const q = searchParams?.q?.trim() ?? '';
  const limit = toPositiveInteger(searchParams?.limit, 10) || 10;
  const offset = toPositiveInteger(searchParams?.offset, 0);

  try {
    const data = await getContacts(token, {
      q: q || undefined,
      limit,
      offset,
    });

    const hasPrevious = offset > 0;
    const nextOffset = offset + limit;
    const hasNext = nextOffset < data.total;

    return (
      <PageReveal className="space-y-4">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <Link
              href="/contacts/new"
              className="inline-flex items-center gap-2 rounded-lg bg-[var(--brand-accent)] px-4 py-2 text-sm font-semibold text-[var(--brand-primary)] transition hover:opacity-90"
            >
              <Plus className="h-4 w-4" />
              New Contact
            </Link>

            <form className="relative w-full md:w-80">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                name="q"
                defaultValue={q}
                placeholder="Search by name, email or phone"
                className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-700 outline-none ring-[var(--brand-accent)] transition focus:ring-2"
              />
              <input type="hidden" name="limit" value={limit} />
              <input type="hidden" name="offset" value={0} />
            </form>
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-[0.16em] text-slate-500">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Phone</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {data.items.length === 0 ? (
                  <tr>
                    <td className="px-4 py-10 text-center text-slate-500" colSpan={4}>
                      No contacts found.
                    </td>
                  </tr>
                ) : (
                  data.items.map((contact) => (
                    <tr key={contact.id} className="border-t border-slate-100 transition hover:bg-slate-50/80">
                      <td className="px-4 py-3 font-medium text-slate-900">{displayName(contact)}</td>
                      <td className="px-4 py-3 text-slate-700">{contact.email ?? 'No email'}</td>
                      <td className="px-4 py-3 text-slate-700">{contact.phone ?? 'No phone'}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold capitalize ${badgeClass(contact.status)}`}
                        >
                          {contact.status ?? 'lead'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3">
            <p className="text-xs text-slate-500">
              Showing {data.items.length} of {data.total}
            </p>
            <div className="flex items-center gap-2">
              <Link
                href={buildQuery({ q: q || undefined, limit, offset: Math.max(offset - limit, 0) })}
                aria-disabled={!hasPrevious}
                className={`rounded-md border px-3 py-1.5 text-xs font-medium transition ${hasPrevious ? 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50' : 'pointer-events-none border-slate-200 bg-slate-100 text-slate-400'}`}
              >
                Previous
              </Link>
              <Link
                href={buildQuery({ q: q || undefined, limit, offset: nextOffset })}
                aria-disabled={!hasNext}
                className={`rounded-md border px-3 py-1.5 text-xs font-medium transition ${hasNext ? 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50' : 'pointer-events-none border-slate-200 bg-slate-100 text-slate-400'}`}
              >
                Next
              </Link>
            </div>
          </div>
        </section>
      </PageReveal>
    );
  } catch (error) {
    if (error instanceof ApiRequestError && error.status === 401) {
      redirect('/login');
    }

    throw error;
  }
}
