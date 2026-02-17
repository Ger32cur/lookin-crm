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

  const query = search.toString();
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/contacts${query ? `?${query}` : ''}`,
    {
      method: 'GET',
      cache: 'no-store',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  if (!response.ok) {
    throw new Error('Unable to fetch contacts');
  }

  return (await response.json()) as ListContactsResponse;
}

export async function createContact(token: string, input: CreateContactInput) {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/contacts`, {
    method: 'POST',
    cache: 'no-store',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new Error('Unable to create contact');
  }

  return (await response.json()) as Contact;
}
