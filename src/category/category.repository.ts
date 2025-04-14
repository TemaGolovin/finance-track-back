import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateCategoryDto, UpdateCategoryDto } from './dto';
import { GetStatCategoriesDto } from './dto/get-stat-categories.dto';
import { getDefaultCategories } from 'src/constants/get-default-categories';

@Injectable()
export class CategoryRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getCategories(userId: string) {
    return await this.prisma.category.findMany({
      where: {
        userId: userId,
      },
    });
  }

  async findUniqueByName(name: string, userId: string, categoryType: 'INCOME' | 'EXPENSE') {
    return await this.prisma.category.findUnique({
      where: { name_userId_categoryType: { name: name.toLowerCase(), userId, categoryType } },
    });
  }

  async findUniqueById(id: string, userId: string) {
    return await this.prisma.category.findUnique({
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

  async updateCategory(id: string, categoryDto: UpdateCategoryDto) {
    return await this.prisma.category.update({
      where: { id },
      data: {
        name: categoryDto.name.toLowerCase(),
      },
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
          },
        },
      },
    });
  }

  async createDefaultsCategories(userId: string, groupId?: string) {
    return await this.prisma.category.createMany({
      data: getDefaultCategories(userId, groupId),
    });
  }
}
