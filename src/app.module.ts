import { Module } from '@nestjs/common';
import { PortfolioModule } from './modules/portfolio/portfolio.module';
import { TenantsModule } from './modules/tenants/tenants.module';
import { LeasingModule } from './modules/leasing/leasing.module';
import { BillingModule } from './modules/billing/billing.module';

@Module({
  imports: [PortfolioModule, TenantsModule, LeasingModule, BillingModule],
})
export class AppModule {}
