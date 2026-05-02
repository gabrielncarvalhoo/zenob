import { Controller, Get, Post, Patch, Param, Body, Query } from '@nestjs/common';
import { BillingService } from './billing.service';

@Controller('receivables')
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Get()
  findAll(@Query() query: { leaseId?: string; limit?: string; tenantId?: string }) {
    const accountId = 'account-teste-001';
    // leaseId mapeia para leaseContractId no Prisma; limit controla quantidade (dueDate ASC)
    const limit = query.limit ? parseInt(query.limit, 10) : undefined;
    return this.billingService.findAllReceivables(accountId, query.leaseId, limit, query.tenantId);
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
