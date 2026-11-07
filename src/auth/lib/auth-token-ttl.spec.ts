import {
  DEFAULT_ACCESS_TOKEN_EXPIRES_IN,
  REFRESH_TOKEN_EXPIRES_IN,
  getAccessTokenExpiresIn,
  getAccessTokenMaxAgeMs,
  getRefreshTokenMaxAgeMs,
  jwtExpiresInToMs,
} from './auth-token-ttl';

describe('auth token ttl', () => {
  const originalAccessExpiresIn = process.env.JWT_ACCESS_EXPIRES_IN;

  afterEach(() => {
    process.env.JWT_ACCESS_EXPIRES_IN = originalAccessExpiresIn ?? '';
  });

  it('converts compact JWT durations to milliseconds', () => {
    expect(jwtExpiresInToMs('30s')).toBe(30_000);
    expect(jwtExpiresInToMs('15m')).toBe(15 * 60 * 1000);
    expect(jwtExpiresInToMs('2h')).toBe(2 * 60 * 60 * 1000);
    expect(jwtExpiresInToMs('7d')).toBe(7 * 24 * 60 * 60 * 1000);
  });

  it('rejects durations the cookie maxAge cannot share with JWT', () => {
    expect(() => jwtExpiresInToMs('15 minutes')).toThrow(/Unsupported JWT expiresIn/);
    expect(() => jwtExpiresInToMs('')).toThrow(/Unsupported JWT expiresIn/);
  });

  it('uses 15m access and 7d refresh when access env is unset', () => {
    process.env.JWT_ACCESS_EXPIRES_IN = '';

    expect(getAccessTokenExpiresIn()).toBe(DEFAULT_ACCESS_TOKEN_EXPIRES_IN);
    expect(getAccessTokenMaxAgeMs()).toBe(15 * 60 * 1000);
    expect(getRefreshTokenMaxAgeMs()).toBe(jwtExpiresInToMs(REFRESH_TOKEN_EXPIRES_IN));
  });

  it('reads access TTL from JWT_ACCESS_EXPIRES_IN', () => {
    process.env.JWT_ACCESS_EXPIRES_IN = '30s';

    expect(getAccessTokenExpiresIn()).toBe('30s');
    expect(getAccessTokenMaxAgeMs()).toBe(30_000);
  });
});
