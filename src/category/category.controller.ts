import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common';
import { CategoryService } from './category.service';
import { CreateCategoryDto, UpdateCategoryDto } from './dto';
import { CategoryResponseEntity, CreateCategoryResponseEntity } from './entity/category.entity';
import {
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
} from '@nestjs/swagger';
import { TemplateErrorResponse } from 'src/constants/TemplateErrorResponse';
import { UserInfo } from 'src/decorators/user-auth-info.decorator';
import { GetStatCategoriesDto } from './dto/get-stat-categories.dto';
import { StatCategoriesEntity } from './entity/stat-categories.entity';

@Controller('category')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Get()
  @ApiOkResponse({ type: CategoryResponseEntity, isArray: true })
  getCategories(@UserInfo() userInfo: { email: string; name: string; id: string }) {
    return this.categoryService.getCategories(userInfo.id);
  }

  @Post()
  @ApiCreatedResponse({ type: CreateCategoryResponseEntity })
  @ApiConflictResponse({ description: 'Category already exists', type: TemplateErrorResponse })
  createCategory(
    @Body() categoryDto: CreateCategoryDto,
    @UserInfo() userInfo: { email: string; name: string; id: string },
  ) {
    return this.categoryService.createCategory(categoryDto, userInfo.id);
  }

  @Put(':id')
  @ApiOkResponse({ type: CreateCategoryResponseEntity })
  @ApiConflictResponse({ description: 'Category already exists', type: TemplateErrorResponse })
  @ApiNotFoundResponse({ description: 'Category not found', type: TemplateErrorResponse })
  updateCategory(
    @Body() categoryDto: UpdateCategoryDto,
    @Param('id') id: string,
    @UserInfo() userInfo: { email: string; name: string; id: string },
  ) {
    return this.categoryService.updateCategory(id, categoryDto, userInfo.id);
  }

  @Delete(':id')
  @ApiOkResponse({ type: CreateCategoryResponseEntity })
  @ApiNotFoundResponse({ description: 'Category not found', type: TemplateErrorResponse })
  deleteCategory(
    @Param('id') id: string,
    @UserInfo() userInfo: { email: string; name: string; id: string },
  ) {
    return this.categoryService.deleteCategory(id, userInfo.id);
  }

  @Get('stat')
  @ApiOkResponse({ type: StatCategoriesEntity })
  getCategoriesStat(
    @UserInfo() userInfo: { email: string; name: string; id: string },
    @Query() { startDate, endDate, operationType }: GetStatCategoriesDto,
  ) {
    return this.categoryService.getStatCategories({
      userId: userInfo.id,
      startDate,
      endDate,
      operationType,
    });
  }
}
