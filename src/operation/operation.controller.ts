import { Body, Controller, Delete, Get, Param, Post, Put, UsePipes } from '@nestjs/common';
import { OperationService } from './operation.service';
import { CreateOperationDto } from './dto';
import { ApiWrapperCreatedResponse, ApiWrapperOkResponse } from 'src/decorators/ApiWrapperResponse';
import {
  CreateOperationEntity,
  OperationEntity,
  UpdateOperationEntity,
} from './entity/operation.entity';
import { ApiNotFoundResponse, ApiOkResponse } from '@nestjs/swagger';
import { TemplateErrorResponse } from 'src/constants/TemplateErrorResponse';

@Controller('operation')
export class OperationController {
  constructor(private readonly operationService: OperationService) {}

  @Get()
  @ApiOkResponse({ type: [OperationEntity] })
  getOperations() {
    return this.operationService.getOperation();
  }

  @Post()
  @ApiWrapperCreatedResponse(CreateOperationEntity)
  @ApiNotFoundResponse({ type: TemplateErrorResponse })
  createOperation(@Body() dto: CreateOperationDto) {
    return this.operationService.createOperation(dto);
  }

  @Put('/:id')
  @ApiWrapperOkResponse(UpdateOperationEntity)
  @ApiNotFoundResponse({ type: TemplateErrorResponse })
  updateOperation(@Body() dto: CreateOperationDto, @Param('id') id: string) {
    return this.operationService.updateOperation(id, dto);
  }

  @Delete('/:id')
  @ApiWrapperOkResponse(UpdateOperationEntity)
  @ApiNotFoundResponse({ type: TemplateErrorResponse })
  deleteOperation(@Param('id') id: string) {
    return this.operationService.deleteOperation(id);
  }
}
