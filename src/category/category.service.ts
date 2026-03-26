import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { I18nService } from 'nestjs-i18n';
import { DEFAULT_CATEGORY_TEMPLATES } from 'src/constants/default-category-templates';
import { CategoryRepository } from './category.repository';
import { CreateCategoryDto, UpdateCategoryDto } from './dto';
import { GetStatCategoriesDto } from './dto/get-stat-categories.dto';

@Injectable()
export class CategoryService {
  constructor(
    private readonly categoryRepository: CategoryRepository,
    private readonly i18n: I18nService,
  ) {}

  async getCategories(userId: string, type?: 'EXPENSE' | 'INCOME') {
    const categories = await this.categoryRepository.getCategories(userId, type);

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
        this.i18n.t('errors.ALREADY_EXISTS', {
          args: {
            entity: 'Category',
            fieldName: 'name',
            fieldValue: categoryDto.name,
          },
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
        this.i18n.t('errors.ALREADY_EXISTS', {
          args: {
            entity: 'Category',
            fieldName: 'name',
            fieldValue: categoryDto.name,
          },
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
          (acc: Prisma.Decimal, category) =>
            acc.plus(
              category.operations.reduce(
                (acc: Prisma.Decimal, operation) => acc.plus(operation.value),
                new Prisma.Decimal(0),
              ),
            ),
          new Prisma.Decimal(0),
        )
      : new Prisma.Decimal(0);

    const statByCategories: { name: string; sum: number; id: string; proportion: number }[] =
      categories
        .reduce((acc, category) => {
          const categorySum = category.operations.reduce(
            (acc: Prisma.Decimal, operation) => acc.plus(operation.value),
            new Prisma.Decimal(0),
          );

          if (categorySum.greaterThan(0)) {
            const ZERO = new Prisma.Decimal(0);
            const HUNDRED = new Prisma.Decimal(100);

            const copyAcc = acc;
            return [
              ...copyAcc,
              {
                name: category.name,
                sum: categorySum,
                type: category.categoryType,
                id: category.id,
                proportion:
                  categorySum.equals(ZERO) || totalSum.equals(ZERO)
                    ? ZERO
                    : categorySum.div(totalSum).mul(HUNDRED),
                color: category.color,
                icon: category.icon,
              },
            ];
          }

          return acc;
        }, [])
        .sort((a, b) => b.sum - a.sum);

    return {
      totalSum,
      categories: statByCategories,
    };
  }

  async validateCategoryExists(id: string): Promise<void> {
    const category = await this.findUniqueById(id);

    if (!category) {
      throw new NotFoundException(
        this.i18n.t('errors.NOT_FOUND', {
          args: { entity: 'Category', id, fieldName: 'id' },
        }),
      );
    }
  }

  async createDefaultCategories(userId: string, groupId?: string) {
    const data = DEFAULT_CATEGORY_TEMPLATES.map((t) => ({
      name: this.i18n.t(`defaultCategories.${t.defaultKey}`),
      categoryType: t.categoryType,
      userId,
      defaultKey: t.defaultKey,
      color: t.color,
      icon: t.icon,
      ...(groupId ? { groupId } : {}),
    }));
    return await this.categoryRepository.createDefaultsCategories(data);
  }

  async findUniqueById(id: string) {
    return await this.categoryRepository.findUniqueById(id);
  }
}
