import { ApiRequestError, apiJsonRequest } from '@/lib/api-client';

export type Contact = {
  id: string;
  organizationId: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  status: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ListContactsResponse = {
  items: Contact[];
  total: number;
  limit: number;
  offset: number;
};

export type CreateContactInput = {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  status?: string;
};

export { ApiRequestError };

export async function getContacts(token: string, params?: { q?: string; limit?: number; offset?: number }) {
  const search = new URLSearchParams();
  if (params?.q) {
    search.set('q', params.q);
  }
  if (typeof params?.limit === 'number') {
    search.set('limit', String(params.limit));
  }
  if (typeof params?.offset === 'number') {
    search.set('offset', String(params.offset));
  }

  return apiJsonRequest<ListContactsResponse>({
    token,
    path: '/api/contacts',
    query: search,
    fallbackMessage: 'Unable to fetch contacts',
  });
}

export async function createContact(token: string, input: CreateContactInput) {
  return apiJsonRequest<Contact>({
    token,
    path: '/api/contacts',
    method: 'POST',
    body: input,
    fallbackMessage: 'Unable to create contact',
  });
}
