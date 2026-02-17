const DEFAULT_API_BASE_URL = 'http://localhost:3001';

export function getApiBaseUrl() {
  if (typeof window !== 'undefined') {
    return process.env.NEXT_PUBLIC_API_URL ?? DEFAULT_API_BASE_URL;
  }

  return process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? DEFAULT_API_BASE_URL;
}
