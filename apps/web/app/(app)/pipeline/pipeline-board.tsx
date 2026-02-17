'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PlusCircle } from 'lucide-react';
import { ApiRequestError } from '@/lib/api-client';
import { type Contact, getContacts } from '@/lib/contacts';
import {
  type Opportunity,
  type Pipeline,
  createOpportunity,
  getOpportunities,
  getPipelines,
  updateOpportunity,
} from '@/lib/pipeline';
import { PageReveal } from '@/components/ui/page-reveal';

type PipelineBoardProps = {
  token: string;
};

type CreateOpportunityFormState = {
  contactId: string;
  title: string;
  value: string;
};

function getContactLabel(contact: Contact) {
  const fullName = [contact.firstName, contact.lastName].filter(Boolean).join(' ').trim();
  if (fullName.length > 0) {
    return fullName;
  }
  return contact.email ?? `Contact ${contact.id.slice(0, 8)}`;
}

function getOpportunityContactName(opportunity: Opportunity) {
  const fullName = [opportunity.contact.firstName, opportunity.contact.lastName]
    .filter(Boolean)
    .join(' ')
    .trim();
  if (fullName.length > 0) {
    return fullName;
  }

  return opportunity.contact.email ?? 'Unnamed Contact';
}

export function PipelineBoard({ token }: PipelineBoardProps) {
  const router = useRouter();
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [selectedPipelineId, setSelectedPipelineId] = useState<string>('');
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loadingInitialData, setLoadingInitialData] = useState(true);
  const [loadingOpportunities, setLoadingOpportunities] = useState(false);
  const [movingOpportunityId, setMovingOpportunityId] = useState<string | null>(null);
  const [creatingOpportunity, setCreatingOpportunity] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [contactSearch, setContactSearch] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [createForm, setCreateForm] = useState<CreateOpportunityFormState>({
    contactId: '',
    title: '',
    value: '',
  });

  useEffect(() => {
    let active = true;

    async function loadInitialData() {
      setLoadingInitialData(true);
      setError(null);

      try {
        const [pipelineItems, contactsResponse] = await Promise.all([
          getPipelines(token),
          getContacts(token, { limit: 200, offset: 0 }),
        ]);

        if (!active) {
          return;
        }

        setPipelines(pipelineItems);
        setContacts(contactsResponse.items);

        if (pipelineItems.length === 0) {
          setSelectedPipelineId('');
          return;
        }

        setSelectedPipelineId((current) =>
          current && pipelineItems.some((item) => item.id === current) ? current : pipelineItems[0].id,
        );
      } catch (loadError) {
        if (loadError instanceof ApiRequestError && loadError.status === 401) {
          router.push('/login');
          router.refresh();
          return;
        }

        setError(loadError instanceof Error ? loadError.message : 'Unable to load pipeline data');
      } finally {
        if (active) {
          setLoadingInitialData(false);
        }
      }
    }

    void loadInitialData();

    return () => {
      active = false;
    };
  }, [router, token]);

  useEffect(() => {
    let active = true;

    async function loadPipelineOpportunities() {
      if (!selectedPipelineId) {
        setOpportunities([]);
        return;
      }

      setLoadingOpportunities(true);
      setError(null);

      try {
        const items = await getOpportunities(token, selectedPipelineId);

        if (!active) {
          return;
        }

        setOpportunities(items);
      } catch (loadError) {
        if (loadError instanceof ApiRequestError && loadError.status === 401) {
          router.push('/login');
          router.refresh();
          return;
        }

        setError(loadError instanceof Error ? loadError.message : 'Unable to load opportunities');
      } finally {
        if (active) {
          setLoadingOpportunities(false);
        }
      }
    }

    void loadPipelineOpportunities();

    return () => {
      active = false;
    };
  }, [router, selectedPipelineId, token]);

  const selectedPipeline = useMemo(
    () => pipelines.find((pipeline) => pipeline.id === selectedPipelineId) ?? null,
    [pipelines, selectedPipelineId],
  );

  const visibleContacts = useMemo(() => {
    const query = contactSearch.trim().toLowerCase();
    if (query.length === 0) {
      return contacts;
    }

    return contacts.filter((contact) => {
      const name = getContactLabel(contact).toLowerCase();
      const email = (contact.email ?? '').toLowerCase();
      const phone = (contact.phone ?? '').toLowerCase();
      return name.includes(query) || email.includes(query) || phone.includes(query);
    });
  }, [contactSearch, contacts]);

  const opportunitiesByStage = useMemo(() => {
    if (!selectedPipeline) {
      return [];
    }

    return selectedPipeline.stages.map((stage) => ({
      stage,
      items: opportunities.filter((opportunity) => opportunity.stageId === stage.id),
    }));
  }, [opportunities, selectedPipeline]);

  async function handleMoveOpportunity(opportunity: Opportunity, nextStageId: string) {
    if (opportunity.stageId === nextStageId) {
      return;
    }

    const nextStage = selectedPipeline?.stages.find((stage) => stage.id === nextStageId);
    if (!nextStage) {
      return;
    }

    let snapshot: Opportunity[] = [];
    setError(null);
    setMovingOpportunityId(opportunity.id);
    setOpportunities((previous) => {
      snapshot = previous;
      return previous.map((item) =>
        item.id === opportunity.id
          ? {
              ...item,
              stageId: nextStageId,
              stage: {
                id: nextStage.id,
                name: nextStage.name,
                order: nextStage.order,
              },
            }
          : item,
      );
    });

    try {
      const updated = await updateOpportunity(token, opportunity.id, { stageId: nextStageId });
      setOpportunities((previous) => previous.map((item) => (item.id === updated.id ? updated : item)));
    } catch (moveError) {
      setOpportunities(snapshot);
      if (moveError instanceof ApiRequestError && moveError.status === 401) {
        router.push('/login');
        router.refresh();
        return;
      }
      setError(moveError instanceof Error ? moveError.message : 'Unable to move opportunity');
    } finally {
      setMovingOpportunityId(null);
    }
  }

  async function handleCreateOpportunity(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedPipelineId || !createForm.contactId) {
      setError('Select a pipeline and contact');
      return;
    }

    const numericValue =
      createForm.value.trim().length > 0 ? Number(createForm.value.trim()) : undefined;

    if (typeof numericValue !== 'undefined' && (!Number.isInteger(numericValue) || numericValue < 0)) {
      setError('Value must be a non-negative integer');
      return;
    }

    setCreatingOpportunity(true);
    setError(null);

    try {
      const created = await createOpportunity(token, {
        pipelineId: selectedPipelineId,
        contactId: createForm.contactId,
        title: createForm.title.trim() || undefined,
        value: numericValue,
      });

      setOpportunities((previous) => [created, ...previous]);
      setCreateForm({ contactId: '', title: '', value: '' });
      setShowCreateForm(false);
      setContactSearch('');
    } catch (createError) {
      if (createError instanceof ApiRequestError && createError.status === 401) {
        router.push('/login');
        router.refresh();
        return;
      }
      setError(createError instanceof Error ? createError.message : 'Unable to create opportunity');
    } finally {
      setCreatingOpportunity(false);
    }
  }

  if (loadingInitialData) {
    return (
      <PageReveal className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-slate-600">Loading pipeline board...</p>
      </PageReveal>
    );
  }

  if (!selectedPipeline) {
    return (
      <PageReveal className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-slate-600">No pipelines configured for this organization.</p>
      </PageReveal>
    );
  }

  return (
    <PageReveal className="space-y-4">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">CRM Pipeline</p>
            <h1 className="mt-1 text-4xl text-[var(--brand-primary)]">Kanban Board</h1>
            <p className="mt-2 text-sm text-slate-600">
              Track opportunities by stage and move deals through your sales process.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <select
              value={selectedPipelineId}
              onChange={(event) => setSelectedPipelineId(event.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none ring-[var(--brand-accent)] transition focus:ring-2"
            >
              {pipelines.map((pipeline) => (
                <option key={pipeline.id} value={pipeline.id}>
                  {pipeline.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => setShowCreateForm((current) => !current)}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-[var(--brand-accent)] px-4 py-2 text-sm font-semibold text-[var(--brand-primary)] transition hover:opacity-90"
            >
              <PlusCircle className="h-4 w-4" />
              Create Opportunity
            </button>
          </div>
        </div>

        {showCreateForm ? (
          <form onSubmit={handleCreateOpportunity} className="mt-4 space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="grid gap-3 md:grid-cols-2">
              <label className="space-y-1">
                <span className="text-xs uppercase tracking-[0.14em] text-slate-500">Search Contact</span>
                <input
                  value={contactSearch}
                  onChange={(event) => setContactSearch(event.target.value)}
                  placeholder="Type name, email or phone"
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none ring-[var(--brand-accent)] transition focus:ring-2"
                />
              </label>

              <label className="space-y-1">
                <span className="text-xs uppercase tracking-[0.14em] text-slate-500">Contact</span>
                <select
                  value={createForm.contactId}
                  onChange={(event) =>
                    setCreateForm((current) => ({ ...current, contactId: event.target.value }))
                  }
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none ring-[var(--brand-accent)] transition focus:ring-2"
                  required
                >
                  <option value="">Select a contact</option>
                  {visibleContacts.map((contact) => (
                    <option key={contact.id} value={contact.id}>
                      {getContactLabel(contact)}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-1">
                <span className="text-xs uppercase tracking-[0.14em] text-slate-500">Title</span>
                <input
                  value={createForm.title}
                  onChange={(event) =>
                    setCreateForm((current) => ({ ...current, title: event.target.value }))
                  }
                  placeholder="FamilyPool Annual Contract"
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none ring-[var(--brand-accent)] transition focus:ring-2"
                />
              </label>

              <label className="space-y-1">
                <span className="text-xs uppercase tracking-[0.14em] text-slate-500">Value (optional)</span>
                <input
                  value={createForm.value}
                  onChange={(event) =>
                    setCreateForm((current) => ({ ...current, value: event.target.value }))
                  }
                  type="number"
                  min={0}
                  step={1}
                  placeholder="12000"
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none ring-[var(--brand-accent)] transition focus:ring-2"
                />
              </label>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="submit"
                disabled={creatingOpportunity}
                className="rounded-lg bg-[var(--brand-accent)] px-4 py-2 text-sm font-semibold text-[var(--brand-primary)] transition hover:opacity-90 disabled:opacity-60"
              >
                {creatingOpportunity ? 'Creating...' : 'Create Opportunity'}
              </button>
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : null}

        {error ? (
          <p className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {error}
          </p>
        ) : null}
      </section>

      <section className="overflow-x-auto">
        <div className="grid min-w-[950px] gap-4 lg:grid-cols-5">
          {opportunitiesByStage.map(({ stage, items }) => (
            <article key={stage.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-lg text-[var(--brand-primary)]">{stage.name}</h2>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
                  {items.length}
                </span>
              </div>

              {loadingOpportunities ? (
                <p className="text-sm text-slate-500">Loading...</p>
              ) : null}

              {!loadingOpportunities && items.length === 0 ? (
                <p className="text-sm text-slate-500">No opportunities in this stage.</p>
              ) : null}

              <div className="space-y-3">
                {items.map((opportunity) => (
                  <div key={opportunity.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <p className="text-sm font-semibold text-slate-900">{opportunity.title}</p>
                    <p className="mt-1 text-xs text-slate-600">{getOpportunityContactName(opportunity)}</p>
                    {opportunity.value !== null ? (
                      <p className="mt-1 text-xs font-medium text-emerald-700">
                        Value: ${opportunity.value.toLocaleString()}
                      </p>
                    ) : null}

                    <label className="mt-3 block space-y-1">
                      <span className="text-[11px] uppercase tracking-[0.14em] text-slate-500">Move</span>
                      <select
                        value={opportunity.stageId}
                        onChange={(event) => void handleMoveOpportunity(opportunity, event.target.value)}
                        disabled={movingOpportunityId === opportunity.id}
                        className="w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-700 outline-none ring-[var(--brand-accent)] transition focus:ring-2 disabled:opacity-60"
                      >
                        {selectedPipeline.stages.map((pipelineStage) => (
                          <option key={pipelineStage.id} value={pipelineStage.id}>
                            {pipelineStage.name}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>
    </PageReveal>
  );
}
