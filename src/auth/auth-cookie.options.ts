import type { CookieOptions } from 'express';
import { getAccessTokenMaxAgeMs, getRefreshTokenMaxAgeMs } from './lib/auth-token-ttl';

export function isAuthCookieSecure(): boolean {
  const explicit = process.env.COOKIE_SECURE;
  if (explicit !== undefined && explicit !== '') {
    return explicit === 'true' || explicit === '1';
  }

  return process.env.NODE_ENV === 'production';
}

function getAuthCookieBaseOptions(): CookieOptions {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: isAuthCookieSecure(),
    path: '/',
  };
}

export function getAccessTokenCookieOptions(): CookieOptions {
  return {
    ...getAuthCookieBaseOptions(),
    maxAge: getAccessTokenMaxAgeMs(),
  };
}

export function getRefreshTokenCookieOptions(): CookieOptions {
  return {
    ...getAuthCookieBaseOptions(),
    maxAge: getRefreshTokenMaxAgeMs(),
  };
}

export function getAuthCookieClearOptions(): CookieOptions {
  return getAuthCookieBaseOptions();
}
