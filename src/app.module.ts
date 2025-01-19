import { Global, Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { OperationModule } from './operation/operation.module';
import { PrismaModule } from './prisma/prisma.module';


@Global()
@Module({
  imports: [OperationModule, PrismaModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
