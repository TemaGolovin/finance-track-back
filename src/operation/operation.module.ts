import { Module } from '@nestjs/common';
import { OperationController } from './operation.controller';
import { OperationService } from './operation.service';

@Module({
  controllers: [OperationController],
  providers: [OperationService],
})
export class OperationModule {}
