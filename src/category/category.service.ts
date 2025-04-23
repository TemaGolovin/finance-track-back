import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { ERRORS_MESSAGES } from 'src/constants/errors';
import { UpdateCategoryDto, CreateCategoryDto } from './dto';
import { GetStatCategoriesDto } from './dto/get-stat-categories.dto';
import { CategoryRepository } from './category.repository';

@Injectable()
export class CategoryService {
  constructor(private readonly categoryRepository: CategoryRepository) {}

  async getCategories(userId: string) {
    const categories = await this.categoryRepository.getCategories(userId);

    return categories;
  }

  async createCategory(categoryDto: CreateCategoryDto, userId: string) {
    const categoryExists = await this.categoryRepository.findUniqueByName(
      categoryDto.name,
      userId,
      categoryDto.categoryType,
    );

    if (categoryExists) {
      throw new ConflictException(
        ERRORS_MESSAGES.ALREADY_EXISTS({
          entity: 'Category',
          fieldName: 'name',
          fieldValue: categoryDto.name,
        }),
      );
    }

    const category = await this.categoryRepository.createCategory(categoryDto, userId);

    return category;
  }

  async updateCategory(id: string, categoryDto: UpdateCategoryDto, userId: string) {
    await this.validateCategoryExists(id);

    const categoryExists = await this.categoryRepository.findUniqueWithNotId(
      categoryDto.name,
      userId,
      id,
      categoryDto.categoryType,
    );

    if (categoryExists) {
      throw new ConflictException(
        ERRORS_MESSAGES.ALREADY_EXISTS({
          entity: 'Category',
          fieldName: 'name',
          fieldValue: categoryDto.name,
        }),
      );
    }

    const category = await this.categoryRepository.updateCategory(id, categoryDto);

    return category;
  }

  async deleteCategory(id: string, userId: string) {
    await this.validateCategoryExists(id);

    const category = await this.categoryRepository.deleteCategory(id, userId);

    return category;
  }

  async getStatCategories({
    userId,
    startDate,
    endDate,
    operationType,
  }: GetStatCategoriesDto & { userId: string }) {
    const categories = await this.categoryRepository.findManyWithFilterTypeAndDate({
      startDate,
      endDate,
      operationType,
      userId,
    });

    const totalSum = categories?.length
      ? categories.reduce(
          (acc, category) =>
            acc + category.operations.reduce((acc, operation) => acc + operation.value, 0),
          0,
        )
      : 0;

    const statByCategories: { name: string; sum: number; id: string; proportion: number }[] =
      categories.map((category) => {
        const categorySum = category.operations.reduce(
          (acc, operation) => acc + operation.value,
          0,
        );

        return {
          name: category.name,
          sum: categorySum,
          id: category.id,
          proportion: categorySum === 0 || totalSum === 0 ? 0 : (categorySum / totalSum) * 100,
        };
      });

    return {
      totalSum,
      categories: statByCategories,
    };
  }

  async validateCategoryExists(id: string): Promise<void> {
    const category = await this.findUniqueById(id);

    if (!category) {
      throw new NotFoundException(ERRORS_MESSAGES.NOT_FOUND('Category', id));
    }
  }

  async createDefaultCategories(userId: string, groupId?: string) {
    return await this.categoryRepository.createDefaultsCategories(userId, groupId);
  }

  async findUniqueById(id: string) {
    return await this.categoryRepository.findUniqueById(id);
  }
}
