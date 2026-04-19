import { Controller, Get } from '@nestjs/common';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get()
  getKpis() {
    const accountId = 'account-teste-001';
    return this.dashboardService.getKpis(accountId);
  }
}
