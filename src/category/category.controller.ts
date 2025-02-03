import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { CategoryService } from './category.service';
import { CreateCategoryDto } from './dto/create-category.dto';

@Controller('category')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Get()
  getCategories() {
    return this.categoryService.getCategories();
  }

  @Post()
  createCategory(@Body() categoryDto: CreateCategoryDto) {
    return this.categoryService.createCategory(categoryDto);
  }

  @Put(':id')
  updateCategory(@Body() categoryDto: CreateCategoryDto, @Param('id') id: string) {
    return this.categoryService.updateCategory(id, categoryDto);
  }

  @Delete(':id')
  deleteCategory(@Param('id') id: string) {
    return this.categoryService.deleteCategory(id);
  }
}
