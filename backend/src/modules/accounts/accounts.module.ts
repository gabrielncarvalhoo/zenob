import { Module } from '@nestjs/common';
import { AccountsController } from './accounts.controller';
import { AccountsService } from './accounts.service';
import { ClerkService } from './clerk.service';

@Module({
  controllers: [AccountsController],
  providers: [AccountsService, ClerkService],
  exports: [ClerkService],
})
export class AccountsModule {}