import { Controller, Get, Post, Patch, Param, Body } from '@nestjs/common';
import { PortfolioService } from './portfolio.service';

@Controller('properties')
export class PortfolioController {
  constructor(private readonly portfolioService: PortfolioService) {}

  @Get()
  findAll() {
    const accountId = 'account-teste-001';
    return this.portfolioService.findAllProperties(accountId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    const accountId = 'account-teste-001';
    return this.portfolioService.findOneProperty(id, accountId);
  }

  @Post()
  create(@Body() body: any) {
    const accountId = 'account-teste-001';
    return this.portfolioService.createProperty(accountId, body);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: any) {
    const accountId = 'account-teste-001';
    return this.portfolioService.updateProperty(id, accountId, body);
  }

  @Get(':id/units')
  findUnits(@Param('id') propertyId: string) {
    return this.portfolioService.findAllUnits(propertyId);
  }

  @Post(':id/units')
  createUnit(@Param('id') propertyId: string, @Body() body: any) {
    return this.portfolioService.createUnit(propertyId, body);
  }
}
