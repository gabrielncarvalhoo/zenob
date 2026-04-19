import { Module } from '@nestjs/common';
import { LeasingController } from './leasing.controller';
import { LeasingService } from './leasing.service';

@Module({
  controllers: [LeasingController],
  providers: [LeasingService],
})
export class LeasingModule {}
