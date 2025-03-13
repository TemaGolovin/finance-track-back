import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
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
import { UserInfo } from 'src/decorators/user-auth-info.decorator';

@Controller('operation')
export class OperationController {
  constructor(private readonly operationService: OperationService) {}

  @Get()
  @ApiOkResponse({ type: [OperationEntity] })
  getOperations(@UserInfo() userInfo: { email: string; name: string; id: string }) {
    return this.operationService.getOperation(userInfo.id);
  }

  @Post()
  @ApiWrapperCreatedResponse(CreateOperationEntity)
  @ApiNotFoundResponse({ type: TemplateErrorResponse })
  createOperation(
    @Body() dto: CreateOperationDto,
    @UserInfo() userInfo: { email: string; name: string; id: string },
  ) {
    return this.operationService.createOperation(dto, userInfo.id);
  }

  @Put('/:id')
  @ApiWrapperOkResponse(UpdateOperationEntity)
  @ApiNotFoundResponse({ type: TemplateErrorResponse })
  updateOperation(
    @Body() dto: CreateOperationDto,
    @Param('id') id: string,
    @UserInfo() userInfo: { email: string; name: string; id: string },
  ) {
    return this.operationService.updateOperation(id, dto, userInfo.id);
  }

  @Delete('/:id')
  @ApiWrapperOkResponse(UpdateOperationEntity)
  @ApiNotFoundResponse({ type: TemplateErrorResponse })
  deleteOperation(
    @Param('id') id: string,
    @UserInfo() userInfo: { email: string; name: string; id: string },
  ) {
    return this.operationService.deleteOperation(id, userInfo.id);
  }
}
