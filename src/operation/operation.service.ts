import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateOperationDto } from './dto';
import { ERRORS_MESSAGES } from 'src/constants/errors';
import { OperationRepository } from './operation.repository';
import { CategoryService } from 'src/category/category.service';

@Injectable()
export class OperationService {
  constructor(
    private readonly operationRepository: OperationRepository,
    private readonly categoryService: CategoryService,
  ) {}
  getOperations(
    userId: string,
    startDate: string,
    endDate: string,
    operationType: 'INCOME' | 'EXPENSE',
  ) {
    return this.operationRepository.findManyByUserId({
      userId,
      startDate,
      endDate,
      operationType,
    });
  }

  async createOperation(createOperationDto: CreateOperationDto, userId: string) {
    const category = await this.categoryService.findUniqueById(createOperationDto.categoryId);

    if (!category) {
      throw new NotFoundException(
        ERRORS_MESSAGES.NOT_FOUND('Category', createOperationDto.categoryId),
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
      throw new NotFoundException(ERRORS_MESSAGES.NOT_FOUND('Operation', id));
    }
  }
}
