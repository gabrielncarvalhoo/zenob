import { Controller, Get, Post, Patch, Param, Body, Query, Res } from '@nestjs/common';
import { LeasingService } from './leasing.service';
import { ContractPdfService } from './contract-pdf.service';
import { AccountId } from '../../common/auth/auth.decorators';

@Controller('leases')
export class LeasingController {
  constructor(
    private readonly leasingService: LeasingService,
    private readonly contractPdfService: ContractPdfService,
  ) {}

  @Get()
  findAll(@Query() query: { unitId?: string; status?: string }, @AccountId() accountId: string) {
    return this.leasingService.findAllContracts(accountId, {
      unitId: query.unitId,
      status: query.status,
    });
  }

  @Get(':id')
  findOne(@Param('id') id: string, @AccountId() accountId: string) {
    return this.leasingService.findOneContract(id, accountId);
  }

  @Post()
  create(@Body() body: any, @AccountId() accountId: string) {
    return this.leasingService.createContract(accountId, body);
  }

  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body('status') status: any, @AccountId() accountId: string) {
    return this.leasingService.updateContractStatus(id, accountId, status);
  }

  @Post(':id/terminate')
  terminate(@Param('id') id: string, @Body() body: any, @AccountId() accountId: string) {
    return this.leasingService.terminateContract(id, accountId, body);
  }

  @Post(':id/cancel')
  cancel(@Param('id') id: string, @AccountId() accountId: string) {
    return this.leasingService.cancelContract(id, accountId);
  }

  @Patch(':id/rent-amount')
  adjustRentAmount(@Param('id') id: string, @Body('rentAmount') rentAmount: string, @AccountId() accountId: string) {
    return this.leasingService.adjustRentAmount(id, accountId, rentAmount);
  }

  @Post(':id/renew')
  renew(@Param('id') id: string, @Body() body: any, @AccountId() accountId: string) {
    return this.leasingService.renewContract(id, accountId, body);
  }

  @Get(':id/contract/pdf')
  async getContractPdf(
    @Param('id') id: string,
    @Query('templateId') templateId: string,
    @Res() res: any,
  ) {
    let pdfBuffer: Buffer;
    if (templateId) {
      // Busca template da account
      const { TemplatesService } = await import('../templates/templates.service');
      const templatesService = new TemplatesService();
      const template = await templatesService.findOne(templateId, 'account-teste-001');
      pdfBuffer = await this.contractPdfService.generateFromTemplate(id, template.templateUrl);
    } else {
      pdfBuffer = await this.contractPdfService.generateContractPdf(id);
    }
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="contrato-${id.slice(0, 8)}.pdf"`,
      'Content-Length': pdfBuffer.length,
    });
    res.end(pdfBuffer);
  }
}
