import type { CookieOptions } from 'express';

export function isAuthCookieSecure(): boolean {
  const explicit = process.env.COOKIE_SECURE;
  if (explicit !== undefined && explicit !== '') {
    return explicit === 'true' || explicit === '1';
  }

  return process.env.NODE_ENV === 'production';
}

export function getAuthCookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: isAuthCookieSecure(),
    path: '/',
  };
}
