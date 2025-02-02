import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateOperationDto } from './dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { ERRORS_MESSAGES } from 'src/constants/errors';

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

    await this.validateOperationExists(id);

    const operation = await 
    this.prisma.operation.update({
      where: { id },
      data: createOperationDto,
    });

    return {
      success: true,
      data: operation,
    }
  }

  async deleteOperation(id: string) {

    await this.validateOperationExists(id);

    const operation = await this.prisma.operation.delete({
    where: { id },
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
    };
  }

  async validateOperationExists(id: string): Promise<void> {
    const operation = await this.prisma.operation.findUnique({
      where: { id },
    });
  
    if (!operation) {
      throw new NotFoundException(ERRORS_MESSAGES.NOT_FOUND('Operation', id));
    }
  }
  
}
