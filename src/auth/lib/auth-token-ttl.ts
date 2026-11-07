export const DEFAULT_ACCESS_TOKEN_EXPIRES_IN = '15m';
export const REFRESH_TOKEN_EXPIRES_IN = '7d';

const DURATION_UNIT_MS = {
  s: 1000,
  m: 60 * 1000,
  h: 60 * 60 * 1000,
  d: 24 * 60 * 60 * 1000,
} as const;

type DurationUnit = keyof typeof DURATION_UNIT_MS;

export function jwtExpiresInToMs(expiresIn: string): number {
  const match = /^(\d+)([smhd])$/i.exec(expiresIn.trim());
  if (!match) {
    throw new Error(
      `Unsupported JWT expiresIn "${expiresIn}". Use a compact value like 15m or 7d.`,
    );
  }

  const amount = Number(match[1]);
  const unit = match[2].toLowerCase() as DurationUnit;
  return amount * DURATION_UNIT_MS[unit];
}

export function getAccessTokenExpiresIn(): string {
  const configured = process.env.JWT_ACCESS_EXPIRES_IN?.trim();
  return configured ? configured : DEFAULT_ACCESS_TOKEN_EXPIRES_IN;
}

export function getAccessTokenMaxAgeMs(): number {
  return jwtExpiresInToMs(getAccessTokenExpiresIn());
}

export function getRefreshTokenMaxAgeMs(): number {
  return jwtExpiresInToMs(REFRESH_TOKEN_EXPIRES_IN);
}
