import { Prisma } from '@prisma/client';
import {
  getPrismaUniqueConstraintFields,
  isPrismaUniqueConstraintViolation,
} from './unique-constraint-violation';

function p2002(target: string | string[]): Prisma.PrismaClientKnownRequestError {
  return new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
    code: 'P2002',
    clientVersion: 'test',
    meta: { target },
  });
}

describe('unique-constraint-violation', () => {
  it('detects P2002', () => {
    expect(isPrismaUniqueConstraintViolation(p2002('email'))).toBe(true);
    expect(isPrismaUniqueConstraintViolation(new Error('other'))).toBe(false);
  });

  it('reads target fields from meta', () => {
    expect(getPrismaUniqueConstraintFields(p2002('email'))).toEqual(['email']);
    expect(getPrismaUniqueConstraintFields(p2002(['name', 'userId', 'categoryType']))).toEqual([
      'name',
      'userId',
      'categoryType',
    ]);
  });
});
