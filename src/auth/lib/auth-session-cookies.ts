import type { Response } from 'express';
import {
  getAccessTokenCookieOptions,
  getAuthCookieClearOptions,
  getRefreshTokenCookieOptions,
} from '../auth-cookie.options';

export function setAuthSessionCookies(
  response: Response,
  tokens: { refreshToken: string; token: string },
): void {
  response.cookie('refreshToken', tokens.refreshToken, getRefreshTokenCookieOptions());
  response.cookie('accessToken', tokens.token, getAccessTokenCookieOptions());
}

export function clearAuthSessionCookies(response: Response): void {
  const cookieOptions = getAuthCookieClearOptions();
  response.clearCookie('refreshToken', cookieOptions);
  response.clearCookie('accessToken', cookieOptions);
}
