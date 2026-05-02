import { Module } from '@nestjs/common';
import { LeasingController } from './leasing.controller';
import { LeasingService } from './leasing.service';
import { ContractPdfService } from './contract-pdf.service';

@Module({
  controllers: [LeasingController],
  providers: [LeasingService, ContractPdfService],
})
export class LeasingModule {}
