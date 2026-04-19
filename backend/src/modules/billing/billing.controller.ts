import { Controller, Get, Post, Patch, Param, Body } from '@nestjs/common';
import { BillingService } from './billing.service';

@Controller('receivables')
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Get()
  findAll() {
    const accountId = 'account-teste-001';
    return this.billingService.findAllReceivables(accountId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    const accountId = 'account-teste-001';
    return this.billingService.findOneReceivable(id, accountId);
  }

  @Post(':id/payments')
  registerPayment(@Param('id') id: string, @Body() body: any) {
    const accountId = 'account-teste-001';
    return this.billingService.registerPayment(id, accountId, body);
  }

  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body('status') status: any) {
    const accountId = 'account-teste-001';
    return this.billingService.updateReceivableStatus(id, accountId, status);
  }

  @Post(':id/waive')
  waive(@Param('id') id: string) {
    const accountId = 'account-teste-001';
    return this.billingService.waiveReceivable(id, accountId);
  }
}
