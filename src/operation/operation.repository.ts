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

  updateOperation(id: string, operationDto: CreateOperationDto) {
    return this.prisma.operation.update({
      where: { id },
      data: operationDto,
    });
  }

  deleteOperation(id: string) {
    return this.prisma.operation.delete({
      where: { id },
    });
  }

  findUniqueById(id: string) {
    return this.prisma.operation.findUnique({
      where: { id },
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
}
