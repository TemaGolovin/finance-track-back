import { Injectable, NotFoundException } from '@nestjs/common';
import { Operation, Prisma } from '@prisma/client';
import { I18nService } from 'nestjs-i18n';
import { CategoryService } from 'src/category/category.service';
import { CreateOperationDto } from './dto';
import { OperationRepository } from './operation.repository';

@Injectable()
export class OperationService {
  constructor(
    private readonly operationRepository: OperationRepository,
    private readonly categoryService: CategoryService,
    private readonly i18n: I18nService,
  ) {}
  async getOperations(
    userId: string,
    startDate: string,
    endDate: string,
    operationType: 'INCOME' | 'EXPENSE',
    categoryId?: string,
  ) {
    const operations = await this.operationRepository.findManyByUserId({
      userId,
      startDate,
      endDate,
      operationType,
      categoryId,
    });

    const operationsByDate = Object.values(
      operations.reduce(
        (acc, operation) => {
          const date = new Date(operation.operationDate);
          const day = date.getDate();
          const month = date.getMonth() + 1;
          const year = date.getFullYear();
          const formattedDate = `${day.toString().padStart(2, '0')}.${month.toString().padStart(2, '0')}.${year}`;

          if (acc[formattedDate]) {
            acc[formattedDate].operations.push(operation);
          } else {
            acc[formattedDate] = { date: formattedDate, operations: [operation] };
          }

          return acc;
        },
        {} as Record<string, { date: string; operations: Operation[] }>,
      ),
    );

    const totalSum = operations.reduce(
      (acc: Prisma.Decimal, operation) => acc.plus(operation.value),
      new Prisma.Decimal(0),
    );

    return {
      operationsByDate: operationsByDate,
      totalSum,
    };
  }

  async getOperationById(id: string) {
    const operation = await this.operationRepository.findUniqueById(id);

    if (!operation) {
      throw new NotFoundException(
        this.i18n.t('errors.NOT_FOUND', {
          args: { entity: 'Operation', id, fieldName: 'id' },
        }),
      );
    }

    return operation;
  }

  async createOperation(createOperationDto: CreateOperationDto, userId: string) {
    const category = await this.categoryService.findUniqueById(createOperationDto.categoryId);

    if (!category) {
      throw new NotFoundException(
        this.i18n.t('errors.NOT_FOUND', {
          args: {
            entity: 'Category',
            id: createOperationDto.categoryId,
            fieldName: 'id',
          },
        }),
      );
    }

    return await this.operationRepository.createOperation(createOperationDto, userId);
  }

  async updateOperation(id: string, createOperationDto: CreateOperationDto) {
    await this.validateOperationExists(id);

    return this.operationRepository.updateOperation(id, createOperationDto);
  }

  async deleteOperation(id: string) {
    await this.validateOperationExists(id);

    return await this.operationRepository.deleteOperation(id);
  }

  async validateOperationExists(id: string): Promise<void> {
    const operation = await this.operationRepository.findUniqueById(id);

    if (!operation) {
      throw new NotFoundException(
        this.i18n.t('errors.NOT_FOUND', {
          args: { entity: 'Operation', id, fieldName: 'id' },
        }),
      );
    }
  }
}
