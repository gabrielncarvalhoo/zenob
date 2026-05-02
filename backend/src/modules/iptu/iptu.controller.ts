import { Controller, Get, Post, Param, Headers } from '@nestjs/common';
import { IptuService } from './iptu.service';

@Controller('iptu')
export class IptuController {
  constructor(private readonly iptuService: IptuService) {}

  @Get('properties')
  async getPropertiesStatus(@Headers('x-account-id') accountId: string) {
    return this.iptuService.getPropertiesIptuStatus(accountId);
  }

  @Get('dashboard')
  async getDashboard(@Headers('x-account-id') accountId: string) {
    return this.iptuService.getDashboardSummary(accountId);
  }

  @Post('batch-check')
  async batchCheck(@Headers('x-account-id') accountId: string) {
    return this.iptuService.batchCheckAll(accountId);
  }

  @Post('confirm/:propertyId')
  async confirmPayment(
    @Param('propertyId') propertyId: string,
    @Headers('x-account-id') accountId: string,
  ) {
    return this.iptuService.confirmPayment(propertyId, accountId);
  }

  @Post('verify/:propertyId')
  async verify(
    @Param('propertyId') propertyId: string,
    @Headers('x-account-id') accountId: string,
  ) {
    return this.iptuService.verifyProperty(propertyId, accountId);
  }
}
