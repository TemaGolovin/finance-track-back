import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateOperationDto } from './dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { ERRORS_MESSAGES } from 'src/constants/errors';

@Injectable()
export class OperationService {
  constructor(private readonly prisma: PrismaService) {}
  getOperation(
    userId: string,
    startDate: string,
    endDate: string,
    operationType: 'INCOME' | 'EXPENSE',
  ) {
    const operations = this.prisma.operation.findMany({
      where: {
        userId,
        operationDate: {
          ...(startDate && { gte: new Date(startDate) }),
          ...(endDate && { lte: new Date(endDate) }),
        },
        type: operationType,
      },
    });

    return operations;
  }

  async createOperation(createOperationDto: CreateOperationDto, userId: string) {
    const category = await this.prisma.category.findUnique({
      where: { id: createOperationDto.categoryId, userId },
    });

    if (!category) {
      throw new NotFoundException(
        ERRORS_MESSAGES.NOT_FOUND('Category', createOperationDto.categoryId),
      );
    }

    const operation = await this.prisma.operation.create({
      data: { ...createOperationDto, userId },
    });

    return {
      success: true,
      data: operation,
    };
  }

  async updateOperation(id: string, createOperationDto: CreateOperationDto, userId: string) {
    await this.validateOperationExists(id);

    const operation = await this.prisma.operation.update({
      where: { id, userId },
      data: createOperationDto,
    });

    return {
      success: true,
      data: operation,
    };
  }

  async deleteOperation(id: string, userId: string) {
    await this.validateOperationExists(id, userId);

    const operation = await this.prisma.operation.delete({
      where: { id, userId },
    });

    return {
      success: true,
      data: operation,
    };
  }

  async validateOperationExists(id: string, userId?: string): Promise<void> {
    const operation = await this.prisma.operation.findUnique({
      where: { id, userId },
    });

    if (!operation) {
      throw new NotFoundException(ERRORS_MESSAGES.NOT_FOUND('Operation', id));
    }
  }
}
