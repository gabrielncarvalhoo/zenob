import { Controller, Get, Post, Body, Param, Header } from '@nestjs/common';
import { IptuService } from './iptu.service';

@Controller('iptu')
export class IptuController {
  constructor(private readonly iptuService: IptuService) {}

  @Get('properties')
  async getPropertiesStatus(@Header('x-account-id') accountId: string) {
    return this.iptuService.getPropertiesIptuStatus(accountId);
  }

  @Get('dashboard')
  async getDashboard(@Header('x-account-id') accountId: string) {
    return this.iptuService.getDashboardSummary(accountId);
  }

  @Post('batch-check')
  async batchCheck(@Header('x-account-id') accountId: string) {
    return this.iptuService.batchCheckAll(accountId);
  }

  @Post('confirm/:propertyId')
  async confirmPayment(
    @Param('propertyId') propertyId: string,
    @Header('x-account-id') accountId: string,
  ) {
    return this.iptuService.confirmPayment(propertyId, accountId);
  }
}
