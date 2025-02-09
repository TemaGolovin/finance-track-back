import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { ERRORS_MESSAGES } from 'src/constants/errors';

@Injectable()
export class CategoryService {
  constructor(private readonly prisma: PrismaService) {}

  async getCategories() {
    const categories = await this.prisma.category.findMany();

    return categories;
  }

  async createCategory(categoryDto: CreateCategoryDto) {
    const categoryExists = await this.prisma.category.findUnique({
      where: { name: categoryDto.name.toLowerCase() },
    });

    if (categoryExists) {
      throw new ConflictException(ERRORS_MESSAGES.ALREADY_EXISTS({
        entity: 'Category',
        fieldName: 'name',
        fieldValue: categoryDto.name,
      }));
    }

    const category = await this.prisma.category.create({
      data: {...categoryDto, name: categoryDto.name.toLowerCase()},
    });

    return {
      success: true,
      data: category,
    };
  }

    async updateCategory(id: string, categoryDto: CreateCategoryDto) {
      await this.validateCategoryExists(id);

      const categoryExists = await this.prisma.category.findUnique({
        where: { name: categoryDto.name.toLowerCase(), NOT: { id } },
      });

      if (categoryExists) {
        throw new ConflictException(ERRORS_MESSAGES.ALREADY_EXISTS({
          entity: 'Category',
          fieldName: 'name',
          fieldValue: categoryDto.name,
        }));
      }

      const category = await this.prisma.category.update({
        where: { id },
        data: categoryDto.name.toLowerCase(),
      });
    
      return {
        success: true,
        data: category,
      };
    }

    async deleteCategory(id: string) {
      await this.validateCategoryExists(id);

      const category = await this.prisma.category.delete({
        where: { id },
      });
    
      return {
        success: true,
        data: category,
      };
    }

    async validateCategoryExists(id: string): Promise<void> {
      const operation = await this.prisma.category.findUnique({
        where: { id },
      });
    
      if (!operation) {
        throw new NotFoundException(ERRORS_MESSAGES.NOT_FOUND('Category', id));
      }
    }
}
