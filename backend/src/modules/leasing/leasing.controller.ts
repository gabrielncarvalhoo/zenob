import { Controller, Get, Post, Patch, Param, Body } from '@nestjs/common';
import { LeasingService } from './leasing.service';

@Controller('leases')
export class LeasingController {
  constructor(private readonly leasingService: LeasingService) {}

  @Get()
  findAll() {
    const accountId = 'account-teste-001';
    return this.leasingService.findAllContracts(accountId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    const accountId = 'account-teste-001';
    return this.leasingService.findOneContract(id, accountId);
  }

  @Post()
  create(@Body() body: any) {
    const accountId = 'account-teste-001';
    return this.leasingService.createContract(accountId, body);
  }

  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body('status') status: any) {
    const accountId = 'account-teste-001';
    return this.leasingService.updateContractStatus(id, accountId, status);
  }

  @Post(':id/terminate')
  terminate(@Param('id') id: string, @Body() body: any) {
    const accountId = 'account-teste-001';
    return this.leasingService.terminateContract(id, accountId, body);
  }
}
