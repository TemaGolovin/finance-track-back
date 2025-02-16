import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { CategoryService } from './category.service';
import { CreateCategoryDto, UpdateCategoryDto } from './dto';
import { CategoryResponseEntity, CreateCategoryResponseEntity } from './entity/category.entity';
import { ResponseWrapper } from 'src/constants/response-wrapper';
import { ApiConflictResponse, ApiNotFoundResponse, ApiOkResponse } from '@nestjs/swagger';
import { ApiWrapperCreatedResponse, ApiWrapperOkResponse } from 'src/decorators/ApiWrapperResponse';
import { TemplateErrorResponse } from 'src/constants/TemplateErrorResponse';

@Controller('category')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Get()
  @ApiOkResponse({ type: CategoryResponseEntity, isArray: true })
  getCategories() {
    return this.categoryService.getCategories();
  }

  @Post()
  @ApiWrapperCreatedResponse(CreateCategoryResponseEntity)
  @ApiConflictResponse({ description: 'Category already exists', type: TemplateErrorResponse })
  createCategory(
    @Body() categoryDto: CreateCategoryDto,
  ): Promise<ResponseWrapper<CreateCategoryResponseEntity>> {
    return this.categoryService.createCategory(categoryDto);
  }

  @Put(':id')

  @ApiWrapperOkResponse(CreateCategoryResponseEntity)
  @ApiConflictResponse({ description: 'Category already exists', type: TemplateErrorResponse })
  @ApiNotFoundResponse({ description: 'Category not found', type: TemplateErrorResponse })
  updateCategory(@Body() categoryDto: UpdateCategoryDto, @Param('id') id: string) {
    return this.categoryService.updateCategory(id, categoryDto);
  }

  @Delete(':id')
  @ApiWrapperOkResponse(CreateCategoryResponseEntity)
  @ApiNotFoundResponse({ description: 'Category not found', type: TemplateErrorResponse })
  deleteCategory(@Param('id') id: string) {
    return this.categoryService.deleteCategory(id);
  }
}
