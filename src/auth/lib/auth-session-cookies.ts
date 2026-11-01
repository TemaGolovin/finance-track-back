import type { Response } from 'express';
import { getAuthCookieOptions } from '../auth-cookie.options';

export function setAuthSessionCookies(
  response: Response,
  tokens: { refreshToken: string; token: string },
): void {
  const cookieOptions = getAuthCookieOptions();
  response.cookie('refreshToken', tokens.refreshToken, cookieOptions);
  response.cookie('accessToken', tokens.token, cookieOptions);
}

export function clearAuthSessionCookies(response: Response): void {
  const cookieOptions = getAuthCookieOptions();
  response.clearCookie('refreshToken', cookieOptions);
  response.clearCookie('accessToken', cookieOptions);
}
