import { Module } from '@nestjs/common';
import { BillingController } from './billing.controller';
import { BillingService } from './billing.service';
import { PdfService } from './pdf.service';
import { EmailModule } from '../notifications/email.module';

@Module({
  controllers: [BillingController],
  providers: [BillingService, PdfService],
  imports: [EmailModule],
})
export class BillingModule {}
