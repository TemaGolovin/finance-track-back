import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { ERRORS_MESSAGES } from 'src/constants/errors';
import { UpdateCategoryDto, CreateCategoryDto } from './dto';

@Injectable()
export class CategoryService {
  constructor(private readonly prisma: PrismaService) {}

  async getCategories(userId: string) {
    console.log(userId);

    const categories = await this.prisma.category.findMany({
      where: {
        userId: userId,
      },
    });

    return categories;
  }

  async createCategory(categoryDto: CreateCategoryDto, userId: string) {
    const categoryExists = await this.prisma.category.findFirst({
      where: { name: categoryDto.name.toLowerCase(), userId },
    });

    if (categoryExists) {
      throw new ConflictException(
        ERRORS_MESSAGES.ALREADY_EXISTS({
          entity: 'Category',
          fieldName: 'name',
          fieldValue: categoryDto.name,
        }),
      );
    }

    const category = await this.prisma.category.create({
      data: { ...categoryDto, name: categoryDto.name.toLowerCase(), userId },
    });

    return {
      success: true,
      data: category,
    };
  }

  async updateCategory(id: string, categoryDto: UpdateCategoryDto, userId: string) {
    await this.validateCategoryExists(id);

    const categoryExists = await this.prisma.category.findFirst({
      where: { name: categoryDto.name.toLowerCase(), NOT: { id }, userId },
    });

    if (categoryExists) {
      throw new ConflictException(
        ERRORS_MESSAGES.ALREADY_EXISTS({
          entity: 'Category',
          fieldName: 'name',
          fieldValue: categoryDto.name,
        }),
      );
    }

    const category = await this.prisma.category.update({
      where: { id },
      data: {
        name: categoryDto.name.toLowerCase(),
        userId: userId,
      },
    });

    return {
      success: true,
      data: category,
    };
  }

  async deleteCategory(id: string, userId: string) {
    await this.validateCategoryExists(id, userId);

    const category = await this.prisma.category.delete({
      where: { id, userId },
    });

    return {
      success: true,
      data: category,
    };
  }

  async validateCategoryExists(id: string, userId?: string): Promise<void> {
    const operation = await this.prisma.category.findUnique({
      where: { id, userId },
    });

    if (!operation) {
      throw new NotFoundException(ERRORS_MESSAGES.NOT_FOUND('Category', id));
    }
  }
}
