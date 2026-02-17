import { getApiBaseUrl } from '@/lib/api-base-url';

export class ApiRequestError extends Error {
  public readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiRequestError';
    this.status = status;
  }
}

type ApiJsonRequestOptions = {
  token: string;
  path: string;
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  query?: URLSearchParams;
  body?: unknown;
  fallbackMessage: string;
};

async function parseErrorMessage(response: Response, fallback: string) {
  try {
    const payload = (await response.json()) as { message?: string | string[] };
    if (typeof payload.message === 'string' && payload.message.trim().length > 0) {
      return payload.message;
    }
    if (Array.isArray(payload.message) && payload.message.length > 0) {
      return payload.message.join(', ');
    }
  } catch {
    // Non-JSON responses fallback to a stable message.
  }

  return fallback;
}

export async function apiJsonRequest<T>({
  token,
  path,
  method = 'GET',
  query,
  body,
  fallbackMessage,
}: ApiJsonRequestOptions): Promise<T> {
  const baseUrl = getApiBaseUrl();
  const queryString = query && query.toString().length > 0 ? `?${query.toString()}` : '';
  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
  };

  if (typeof body !== 'undefined') {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(`${baseUrl}${path}${queryString}`, {
    method,
    cache: 'no-store',
    headers,
    body: typeof body === 'undefined' ? undefined : JSON.stringify(body),
  });

  if (!response.ok) {
    const message = await parseErrorMessage(response, fallbackMessage);
    throw new ApiRequestError(message, response.status);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}
