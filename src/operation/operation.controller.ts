import { Body, Controller, Get, Param, Post, Put, UsePipes } from '@nestjs/common';
import { OperationService } from './operation.service';
import { CreateOperationDto } from './dto';

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
}
