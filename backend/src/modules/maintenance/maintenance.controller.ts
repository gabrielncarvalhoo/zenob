import { Controller, Get, Post, Patch, Delete, Param, Body, Query } from '@nestjs/common';
import { MaintenanceService } from './maintenance.service';
import { AccountId } from '../../common/auth/auth.decorators';

@Controller('maintenance')
export class MaintenanceController {
  constructor(private readonly maintenanceService: MaintenanceService) {}

  @Get()
  findAll(
    @Query('propertyId') propertyId?: string,
    @Query('status') status?: string,
    @Query('priority') priority?: string,
    @AccountId() accountId?: string,
  ) {
    return this.maintenanceService.findAll(accountId, { propertyId, status, priority });
  }

  @Get('stats')
  getStats(@AccountId() accountId: string) {
    return this.maintenanceService.getStats(accountId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @AccountId() accountId: string) {
    return this.maintenanceService.findOne(id, accountId);
  }

  @Post()
  create(@Body() body: any, @AccountId() accountId: string) {
    return this.maintenanceService.create(accountId, body);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: any, @AccountId() accountId: string) {
    return this.maintenanceService.update(id, accountId, body);
  }

  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body('status') status: string, @AccountId() accountId: string) {
    return this.maintenanceService.updateStatus(id, accountId, status);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @AccountId() accountId: string) {
    return this.maintenanceService.delete(id, accountId);
  }
}