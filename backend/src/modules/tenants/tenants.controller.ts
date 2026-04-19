import { Controller, Get, Post, Patch, Param, Body } from '@nestjs/common';
import { TenantsService } from './tenants.service';

@Controller('tenants')
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Get()
  findAll() {
    const accountId = 'account-teste-001';
    return this.tenantsService.findAllTenants(accountId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    const accountId = 'account-teste-001';
    return this.tenantsService.findOneTenant(id, accountId);
  }

  @Post()
  create(@Body() body: any) {
    const accountId = 'account-teste-001';
    return this.tenantsService.createTenant(accountId, body);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: any) {
    const accountId = 'account-teste-001';
    return this.tenantsService.updateTenant(id, accountId, body);
  }
}
