import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateCategoryDto, UpdateCategoryDto } from './dto';
import { GetStatCategoriesDto } from './dto/get-stat-categories.dto';

@Injectable()
export class CategoryRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getCategories(userId: string, type?: 'EXPENSE' | 'INCOME') {
    return await this.prisma.category.findMany({
      where: {
        userId: userId,
        categoryType: type,
      },
    });
  }

  async findUniqueByName(name: string, userId: string, categoryType: 'INCOME' | 'EXPENSE') {
    return await this.prisma.category.findUnique({
      where: { name_userId_categoryType: { name: name.toLowerCase(), userId, categoryType } },
    });
  }

  async findFirstByIdAndUserId(id: string, userId: string) {
    return await this.prisma.category.findFirst({
      where: { id, userId },
    });
  }

  async findUniqueWithNotId(
    name: string,
    userId: string,
    id: string,
    categoryType: 'INCOME' | 'EXPENSE',
  ) {
    return await this.prisma.category.findUnique({
      where: {
        name_userId_categoryType: { name: name.toLowerCase(), userId, categoryType },
        NOT: { id },
      },
    });
  }

  async createCategory(categoryDto: CreateCategoryDto, userId: string) {
    return await this.prisma.category.create({
      data: { ...categoryDto, name: categoryDto.name.toLowerCase(), userId },
    });
  }

  async updateCategory(id: string, userId: string, categoryDto: UpdateCategoryDto) {
    const result = await this.prisma.category.updateMany({
      where: { id, userId },
      data: {
        name: categoryDto.name.toLowerCase(),
      },
    });
    if (result.count === 0) {
      return null;
    }
    return await this.prisma.category.findUnique({
      where: { id },
    });
  }

  async deleteCategory(id: string, userId: string) {
    return await this.prisma.category.delete({
      where: { id, userId },
    });
  }

  async findManyWithFilterTypeAndDate({
    startDate,
    endDate,
    operationType,
    userId,
  }: GetStatCategoriesDto & { userId: string }) {
    return await this.prisma.category.findMany({
      where: {
        userId,
        categoryType: operationType,
      },
      include: {
        operations: {
          where: {
            operationDate: {
              ...(startDate && { gte: new Date(startDate) }),
              ...(endDate && { lte: new Date(endDate) }),
            },
            type: {
              equals: operationType,
            },
            value: {
              gt: 0,
            },
          },
        },
      },
    });
  }

  async createDefaultsCategories(data: Prisma.CategoryCreateManyInput[]) {
    return await this.prisma.category.createMany({
      data,
    });
  }
}
