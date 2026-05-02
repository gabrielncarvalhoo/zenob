import { Controller, Get, Post, Patch, Param, Body, Query, Res } from '@nestjs/common';
import { BillingService } from './billing.service';
import { PdfService } from './pdf.service';
import { AccountId } from '../../common/auth/auth.decorators';

@Controller('receivables')
export class BillingController {
  constructor(
    private readonly billingService: BillingService,
    private readonly pdfService: PdfService,
  ) {}

  @Get()
  findAll(@Query() query: { leaseId?: string; limit?: string; tenantId?: string }, @AccountId() accountId: string) {
    const limit = query.limit ? parseInt(query.limit, 10) : undefined;
    return this.billingService.findAllReceivables(accountId, query.leaseId, limit, query.tenantId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @AccountId() accountId: string) {
    return this.billingService.findOneReceivable(id, accountId);
  }

  @Post(':id/payments')
  registerPayment(@Param('id') id: string, @Body() body: any, @AccountId() accountId: string) {
    return this.billingService.registerPayment(id, accountId, body);
  }

  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body('status') status: any, @AccountId() accountId: string) {
    return this.billingService.updateReceivableStatus(id, accountId, status);
  }

  @Post(':id/waive')
  waive(@Param('id') id: string, @AccountId() accountId: string) {
    return this.billingService.waiveReceivable(id, accountId);
  }

  @Get(':id/receipt/pdf')
  async getReceiptPdf(@Param('id') id: string, @Res() res: any) {
    const pdfBuffer = await this.pdfService.generateReceiptPdf(id);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="recibo-${id.slice(0, 8)}.pdf"`,
      'Content-Length': pdfBuffer.length,
    });
    res.end(pdfBuffer);
  }
}
