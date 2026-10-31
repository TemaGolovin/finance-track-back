export function getAuthThrottleLimit(): number {
  const parsed = Number.parseInt(process.env.AUTH_RATE_LIMIT_MAX ?? '', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 5;
}

export function getAuthThrottleTtlMs(): number {
  const parsed = Number.parseInt(process.env.AUTH_RATE_LIMIT_TTL_MS ?? '', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 60_000;
}

export function getAuthThrottlerModuleConfig() {
  return [
    {
      name: 'auth',
      ttl: getAuthThrottleTtlMs(),
      limit: getAuthThrottleLimit(),
    },
  ] as const;
}
