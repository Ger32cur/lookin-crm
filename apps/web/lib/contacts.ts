import { getApiBaseUrl } from '@/lib/api-base-url';

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

export class ApiRequestError extends Error {
  public readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiRequestError';
    this.status = status;
  }
}

async function parseErrorMessage(response: Response, fallback: string) {
  try {
    const payload = (await response.json()) as { message?: string };
    if (typeof payload.message === 'string' && payload.message.trim().length > 0) {
      return payload.message;
    }
  } catch {
    // If response is not JSON we keep a stable fallback message.
  }
  return fallback;
}

export async function getContacts(token: string, params?: { q?: string; limit?: number; offset?: number }) {
  const baseUrl = getApiBaseUrl();
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

  const query = search.toString();
  const response = await fetch(
    `${baseUrl}/api/contacts${query ? `?${query}` : ''}`,
    {
      method: 'GET',
      cache: 'no-store',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  if (!response.ok) {
    const message = await parseErrorMessage(response, 'Unable to fetch contacts');
    throw new ApiRequestError(message, response.status);
  }

  return (await response.json()) as ListContactsResponse;
}

export async function createContact(token: string, input: CreateContactInput) {
  const baseUrl = getApiBaseUrl();
  const response = await fetch(`${baseUrl}/api/contacts`, {
    method: 'POST',
    cache: 'no-store',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const message = await parseErrorMessage(response, 'Unable to create contact');
    throw new ApiRequestError(message, response.status);
  }

  return (await response.json()) as Contact;
}
