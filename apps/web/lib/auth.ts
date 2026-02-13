export const AUTH_TOKEN_COOKIE = 'lookin_token';

export function setAuthToken(token: string) {
  document.cookie = `${AUTH_TOKEN_COOKIE}=${token}; Path=/; Max-Age=3600; SameSite=Lax`;
}

export function clearAuthToken() {
  document.cookie = `${AUTH_TOKEN_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;
}
