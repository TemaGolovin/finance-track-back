import { Prisma } from '@prisma/client';

export function isPrismaUniqueConstraintViolation(
  error: unknown,
): error is Prisma.PrismaClientKnownRequestError {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';
}

export function getPrismaUniqueConstraintFields(
  error: Prisma.PrismaClientKnownRequestError,
): readonly string[] {
  const target = error.meta?.target;
  if (Array.isArray(target)) {
    return target.filter((item): item is string => typeof item === 'string');
  }
  if (typeof target === 'string') {
    return [target];
  }
  return [];
}
