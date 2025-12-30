import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common';
import { OperationService } from './operation.service';
import { CreateOperationDto } from './dto';
import {
  CreateOperationEntity,
  OperationByDateWithTotalSum,
  UpdateOperationEntity,
} from './entity/operation.entity';
import { ApiCreatedResponse, ApiNotFoundResponse, ApiOkResponse } from '@nestjs/swagger';
import { TemplateErrorResponse } from 'src/constants/TemplateErrorResponse';
import { UserInfo } from 'src/decorators/user-auth-info.decorator';
import { GetOperationDto } from './dto/get-operation.dto';

@Controller('operation')
export class OperationController {
  constructor(private readonly operationService: OperationService) {}

  @Get()
  @ApiOkResponse({ type: OperationByDateWithTotalSum })
  getOperations(
    @UserInfo() userInfo: { email: string; name: string; id: string },
    @Query() { startDate, endDate, operationType, categoryId }: GetOperationDto,
  ) {
    return this.operationService.getOperations(
      userInfo.id,
      startDate,
      endDate,
      operationType,
      categoryId,
    );
  }

  @Post()
  @ApiCreatedResponse({ type: CreateOperationEntity })
  @ApiNotFoundResponse({ type: TemplateErrorResponse })
  createOperation(
    @Body() dto: CreateOperationDto,
    @UserInfo() userInfo: { email: string; name: string; id: string },
  ) {
    return this.operationService.createOperation(dto, userInfo.id);
  }

  @Put('/:id')
  @ApiCreatedResponse({ type: UpdateOperationEntity })
  @ApiNotFoundResponse({ type: TemplateErrorResponse })
  updateOperation(@Body() dto: CreateOperationDto, @Param('id') id: string) {
    return this.operationService.updateOperation(id, dto);
  }

  @Delete('/:id')
  @ApiOkResponse({ type: UpdateOperationEntity })
  @ApiNotFoundResponse({ type: TemplateErrorResponse })
  deleteOperation(@Param('id') id: string) {
    return this.operationService.deleteOperation(id);
  }
}
