import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { PipelinesController } from './pipelines.controller';
import { PipelinesService } from './pipelines.service';

@Module({
  controllers: [PipelinesController],
  providers: [PipelinesService, PrismaService],
})
export class PipelinesModule {}
