import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateCategoryDto, UpdateCategoryDto } from './dto';
import { GetStatCategoriesDto } from './dto/get-stat-categories.dto';

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

  async findUniqueByName(name: string, userId: string) {
    return await this.prisma.category.findUnique({
      where: { name_userId: { name: name.toLowerCase(), userId } },
    });
  }

  async findUniqueById(id: string, userId: string) {
    return await this.prisma.category.findUnique({
      where: { id, userId },
    });
  }

  async findUniqueWithNotId(name: string, userId: string, id: string) {
    return await this.prisma.category.findUnique({
      where: { name_userId: { name: name.toLowerCase(), userId }, NOT: { id } },
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
}
