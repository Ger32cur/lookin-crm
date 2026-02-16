export const AUTH_TOKEN_COOKIE = 'lookin_token';
export const AUTH_TOKEN_STORAGE = 'lookin_token';

export function setAuthToken(token: string) {
  if (typeof window === 'undefined') {
    return;
  }

  const secure = window.location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${AUTH_TOKEN_COOKIE}=${encodeURIComponent(token)}; Path=/; Max-Age=3600; SameSite=Lax${secure}`;
  window.localStorage.setItem(AUTH_TOKEN_STORAGE, token);
}

export function clearAuthToken() {
  if (typeof window === 'undefined') {
    return;
  }

  document.cookie = `${AUTH_TOKEN_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;
  window.localStorage.removeItem(AUTH_TOKEN_STORAGE);
}
