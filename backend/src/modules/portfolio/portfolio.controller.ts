import { Controller, Get, Post, Patch, Param, Body } from '@nestjs/common';
import { PortfolioService } from './portfolio.service';
import { AccountId } from '../../common/auth/auth.decorators';

@Controller('properties')
export class PortfolioController {
  constructor(private readonly portfolioService: PortfolioService) {}

  @Get()
  findAll(@AccountId() accountId: string) {
    return this.portfolioService.findAllProperties(accountId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @AccountId() accountId: string) {
    return this.portfolioService.findOneProperty(id, accountId);
  }

  @Post()
  create(@Body() body: any, @AccountId() accountId: string) {
    return this.portfolioService.createProperty(accountId, body);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: any, @AccountId() accountId: string) {
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
