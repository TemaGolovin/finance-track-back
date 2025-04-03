import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common';
import { CategoryService } from './category.service';
import { CreateCategoryDto, UpdateCategoryDto } from './dto';
import { CategoryResponseEntity, CreateCategoryResponseEntity } from './entity/category.entity';
import { ResponseWrapper } from 'src/constants/response-wrapper';
import { ApiConflictResponse, ApiNotFoundResponse, ApiOkResponse } from '@nestjs/swagger';
import { ApiWrapperCreatedResponse, ApiWrapperOkResponse } from 'src/decorators/ApiWrapperResponse';
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
  @ApiWrapperCreatedResponse(CreateCategoryResponseEntity)
  @ApiConflictResponse({ description: 'Category already exists', type: TemplateErrorResponse })
  createCategory(
    @Body() categoryDto: CreateCategoryDto,
    @UserInfo() userInfo: { email: string; name: string; id: string },
  ): Promise<ResponseWrapper<CreateCategoryResponseEntity>> {
    return this.categoryService.createCategory(categoryDto, userInfo.id);
  }

  @Put(':id')
  @ApiWrapperOkResponse(CreateCategoryResponseEntity)
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
  @ApiWrapperOkResponse(CreateCategoryResponseEntity)
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
