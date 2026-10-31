import { createHash } from 'node:crypto';
import { compare, compareSync, hash, hashSync } from 'bcryptjs';

function refreshTokenDigest(refreshToken: string): string {
  return createHash('sha256').update(refreshToken).digest('hex');
}

export async function hashRefreshTokenForStorage(refreshToken: string): Promise<string> {
  return hash(refreshTokenDigest(refreshToken), 10);
}

export function hashRefreshTokenForStorageSync(refreshToken: string): string {
  return hashSync(refreshTokenDigest(refreshToken), 10);
}

export async function refreshTokenMatchesStorage(
  refreshToken: string,
  storedHash: string,
): Promise<boolean> {
  if (await compare(refreshTokenDigest(refreshToken), storedHash)) {
    return true;
  }

  return compare(refreshToken, storedHash);
}

export function refreshTokenMatchesStorageSync(
  refreshToken: string,
  storedHash: string,
): boolean {
  if (compareSync(refreshTokenDigest(refreshToken), storedHash)) {
    return true;
  }

  return compareSync(refreshToken, storedHash);
}
