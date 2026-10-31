export function omitAuthTokensFromBody<T extends { token: string; refreshToken: string }>(
  data: T,
): Omit<T, 'token' | 'refreshToken'> {
  const { token: _token, refreshToken: _refreshToken, ...rest } = data;
  return rest;
}
