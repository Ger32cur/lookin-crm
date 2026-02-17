import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { AUTH_TOKEN_COOKIE } from '@/lib/auth';
import { getApiBaseUrl } from '@/lib/api-base-url';

export type SessionUser = {
  id: string;
  email: string;
  role: string;
  organizationId: string;
};

export async function fetchSessionUser(token: string) {
  const response = await fetch(`${getApiBaseUrl()}/api/auth/me`, {
    method: 'GET',
    cache: 'no-store',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    return null;
  }

  return (await response.json()) as SessionUser;
}

export async function requireSession() {
  const token = cookies().get(AUTH_TOKEN_COOKIE)?.value;
  if (!token) {
    redirect('/login');
  }

  const user = await fetchSessionUser(token);
  if (!user) {
    redirect('/login');
  }

  return {
    token,
    user,
  };
}
