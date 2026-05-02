import { Controller, Get, Query } from '@nestjs/common';
import { RenewalsService } from './renewals.service';
import { AccountId } from '../../common/auth/auth.decorators';

@Controller('renewals')
export class RenewalsController {
  constructor(private readonly renewalsService: RenewalsService) {}

  // Upcoming renewals for dashboard
  @Get('upcoming')
  getUpcomingRenewals(@AccountId() accountId: string) {
    return this.renewalsService.getUpcomingRenewals(accountId);
  }

  // Trigger send reminders (called by cron or manually)
  @Get('send-due')
  async sendDueReminders() {
    const due = await this.renewalsService.getDueReminders();
    // TODO: Integrate with NotificationsService to send email/WhatsApp
    // For now, just mark as pending notification
    const results = [];
    for (const reminder of due) {
      // Placeholder: emit notification via NotificationsService
      console.log(`Renewal reminder due: contract=${reminder.leaseContractId}, days=${reminder.daysBeforeExpiry}`);
      results.push({ id: reminder.id, status: 'PROCESSED' });
    }
    return { processed: results.length, reminders: results };
  }
}