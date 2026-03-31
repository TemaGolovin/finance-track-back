import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateOperationDto } from './dto';

@Injectable()
export class OperationRepository {
  constructor(private readonly prisma: PrismaService) {}

  findManyByUserId({
    userId,
    startDate,
    endDate,
    operationType,
    categoryId,
  }: {
    userId: string;
    startDate: string;
    endDate: string;
    operationType: 'INCOME' | 'EXPENSE';
    categoryId?: string;
  }) {
    return this.prisma.operation.findMany({
      where: {
        userId,
        categoryId: {
          equals: categoryId,
        },
        operationDate: {
          ...(startDate && { gte: new Date(startDate) }),
          ...(endDate && { lte: new Date(endDate) }),
        },
        type: operationType,
      },
      orderBy: {
        operationDate: 'desc',
      },
      include: {
        category: {
          select: {
            name: true,
            color: true,
            icon: true,
          },
        },
      },
    });
  }

  createOperation(operationDto: CreateOperationDto, userId: string) {
    return this.prisma.operation.create({
      data: { ...operationDto, userId },
    });
  }

  updateOperation(id: string, userId: string, operationDto: CreateOperationDto) {
    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.operation.updateMany({
        where: { id, userId },
        data: operationDto,
      });
      if (updated.count === 0) {
        return null;
      }
      return tx.operation.findFirst({
        where: { id, userId },
        include: {
          category: {
            select: {
              name: true,
              color: true,
              icon: true,
            },
          },
          user: { select: { name: true } },
        },
      });
    });
  }

  deleteOperation(id: string, userId: string) {
    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.operation.findFirst({
        where: { id, userId },
        include: {
          category: {
            select: {
              name: true,
              color: true,
              icon: true,
            },
          },
          user: { select: { name: true } },
        },
      });
      if (!existing) {
        return null;
      }
      await tx.operation.delete({ where: { id } });
      return existing;
    });
  }

  findFirstByIdAndUserId(id: string, userId: string) {
    return this.prisma.operation.findFirst({
      where: { id, userId },
      include: {
        category: {
          select: {
            name: true,
            color: true,
            icon: true,
          },
        },
        user: { select: { name: true } },
      },
    });
  }
}
