import { Controller, Get } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { AccountId } from '../../common/auth/auth.decorators';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get()
  getKpis(@AccountId() accountId: string) {
    return this.dashboardService.getKpis(accountId);
  }

  @Get('historical')
  getHistorical(@AccountId() accountId: string) {
    return this.dashboardService.getHistorical(accountId);
  }

  @Get('occupancy-history')
  getOccupancyHistory(@AccountId() accountId: string) {
    return this.dashboardService.getOccupancyHistory(accountId);
  }

  @Get('receivables-by-status')
  getReceivablesByStatus(@AccountId() accountId: string) {
    return this.dashboardService.getReceivablesByStatus(accountId);
  }

  @Get('expenses-by-category')
  getExpensesByCategory(@AccountId() accountId: string) {
    return this.dashboardService.getExpensesByCategory(accountId);
  }
}