import { Injectable } from '@nestjs/common';
import { CreateOperationDto } from './dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class OperationService {
  constructor(private readonly prisma: PrismaService) {}
  getOperation() {
    const operations = this.prisma.operation.findMany();

    return operations;
  }

  async createOperation(createOperationDto: CreateOperationDto) {
    const operation = await this.prisma.operation.create({
      data: createOperationDto,
    });

    if (!operation) {
      return {
        success: false,
        data: {
          message: 'Operation not created',
        },
      };
    }

    return {
      success: true,
      data: createOperationDto,
    };
  }

  async updateOperation(id: string, createOperationDto: CreateOperationDto) {
    const operation = await this.prisma.operation.update({
      where: { id },
      data: createOperationDto,
    });

    if (!operation) {
      return {
        success: false,
        data: {
          message: 'Operation not found',
        },
      };
    }

    return {
      success: true,
      data: operation,
    }
  }
}
