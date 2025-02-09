import { Body, Controller, Delete, Get, Param, Post, Put, UsePipes } from '@nestjs/common';
import type { OperationService } from './operation.service';
import type { CreateOperationDto } from './dto';

@Controller('operation')
export class OperationController {
  constructor(private readonly operationService: OperationService) {}

  @Get()
  getOperations() {
    return this.operationService.getOperation();
  }

  @Post()
  createOperation(@Body() dto: CreateOperationDto) {
    return this.operationService.createOperation(dto);
  }

  @Put('/:id')
  updateOperation(@Body() dto: CreateOperationDto, @Param('id') id: string) {
    return this.operationService.updateOperation(id, dto);
  }

  @Delete('/:id')
  deleteOperation(@Param('id') id: string) {
    return this.operationService.deleteOperation(id);
  }
}
