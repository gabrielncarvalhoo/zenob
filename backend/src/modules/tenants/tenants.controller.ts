import { Controller, Get, Post, Patch, Param, Body } from '@nestjs/common';
import { TenantsService } from './tenants.service';
import { AccountId } from '../../common/auth/auth.decorators';

@Controller('tenants')
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Get()
  findAll(@AccountId() accountId: string) {
    return this.tenantsService.findAllTenants(accountId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @AccountId() accountId: string) {
    return this.tenantsService.findOneTenant(id, accountId);
  }

  @Post()
  create(@Body() body: any, @AccountId() accountId: string) {
    return this.tenantsService.createTenant(accountId, body);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: any, @AccountId() accountId: string) {
    return this.tenantsService.updateTenant(id, accountId, body);
  }
}
