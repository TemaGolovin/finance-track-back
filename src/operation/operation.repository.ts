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
  }: { userId: string; startDate: string; endDate: string; operationType: 'INCOME' | 'EXPENSE' }) {
    return this.prisma.operation.findMany({
      where: {
        userId,
        operationDate: {
          ...(startDate && { gte: new Date(startDate) }),
          ...(endDate && { lte: new Date(endDate) }),
        },
        type: operationType,
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
    });
  }
}
