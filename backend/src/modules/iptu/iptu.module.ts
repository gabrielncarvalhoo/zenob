import { Module } from '@nestjs/common';
import { IptuController } from './iptu.controller';
import { IptuService } from './iptu.service';

@Module({
  controllers: [IptuController],
  providers: [IptuService],
  exports: [IptuService],
})
export class IptuModule {}
