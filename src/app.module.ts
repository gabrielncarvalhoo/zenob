import { Module } from '@nestjs/common';
import { PortfolioModule } from './modules/portfolio/portfolio.module';
import { TenantsModule } from './modules/tenants/tenants.module';
import { LeasingModule } from './modules/leasing/leasing.module';
import { BillingModule } from './modules/billing/billing.module';
import { ExpensesModule } from './modules/expenses/expenses.module';

@Module({
  imports: [PortfolioModule, TenantsModule, LeasingModule, BillingModule, ExpensesModule],
})
export class AppModule {}
