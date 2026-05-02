import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Days to notify before and after expiry
const REMINDER_DAYS = [-30, -20, -10, -5, -2, -1, 10]; // negative = before, positive = after

@Injectable()
export class RenewalsService {
  // Schedule all reminders for a contract
  async scheduleReminders(contractId: string) {
    const contract = await prisma.leaseContract.findUnique({
      where: { id: contractId },
      include: { unit: { include: { property: true } } },
    });
    if (!contract) return;

    const endDate = new Date(contract.endDate);

    // Remove existing reminders for this contract
    await prisma.renewalReminder.deleteMany({
      where: { leaseContractId: contractId },
    });

    // Create reminders for each day
    for (const days of REMINDER_DAYS) {
      const scheduledDate = new Date(endDate);
      scheduledDate.setDate(scheduledDate.getDate() + days); // days: negative=before, positive=after

      // Only schedule if future date
      if (scheduledDate > new Date()) {
        await prisma.renewalReminder.create({
          data: {
            leaseContractId: contractId,
            scheduledFor: scheduledDate,
            daysBeforeExpiry: days,
            status: 'PENDING',
          },
        });
      }
    }
  }

  // Get reminders due today (for cron job to pick up)
  async getDueReminders() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return prisma.renewalReminder.findMany({
      where: {
        scheduledFor: { gte: today, lt: tomorrow },
        status: 'PENDING',
      },
      include: {
        leaseContract: {
          include: {
            unit: { include: { property: true } },
            leaseTenants: {
              where: { role: 'PRIMARY' },
              include: { tenant: true },
            },
          },
        },
      },
    });
  }

  // Mark reminder as sent
  async markAsSent(id: string, notificationId: string) {
    return prisma.renewalReminder.update({
      where: { id },
      data: { status: 'SENT', notificationId },
    });
  }

  // Cancel reminder
  async cancelReminder(id: string) {
    return prisma.renewalReminder.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });
  }

  // Get upcoming renewals for dashboard (next 60 days)
  async getUpcomingRenewals(accountId: string) {
    const today = new Date();
    const future = new Date(today);
    future.setDate(future.getDate() + 60);

    const contracts = await prisma.leaseContract.findMany({
      where: {
        accountId,
        status: 'ACTIVE',
        endDate: { gte: today, lte: future },
      },
      include: {
        unit: { include: { property: { select: { name: true, address: true } } } },
        leaseTenants: {
          where: { role: 'PRIMARY' },
          include: { tenant: { select: { fullName: true, email: true, phone: true } } },
        },
        renewalReminders: {
          where: { status: 'PENDING' },
          orderBy: { scheduledFor: 'asc' },
          take: 1,
        },
      },
      orderBy: { endDate: 'asc' },
    });

    return contracts.map(c => {
      const tenant = c.leaseTenants[0]?.tenant;
      const nextReminder = c.renewalReminders[0];
      const daysUntilExpiry = Math.ceil((new Date(c.endDate).getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      return {
        contractId: c.id,
        tenantName: tenant?.fullName ?? 'N/A',
        propertyName: c.unit.property.name,
        unitCode: c.unit.code,
        endDate: c.endDate.toISOString().split('T')[0],
        daysUntilExpiry,
        rentAmount: Number(c.rentAmount.toString()),
        nextReminderDate: nextReminder?.scheduledFor.toISOString().split('T')[0] ?? null,
        nextReminderDays: nextReminder?.daysBeforeExpiry ?? null,
        status: c.status,
      };
    });
  }

  // Check if contract needs reminder rescheduling (called when contract is renewed/terminated)
  async cancelAllReminders(contractId: string) {
    await prisma.renewalReminder.updateMany({
      where: { leaseContractId: contractId, status: 'PENDING' },
      data: { status: 'CANCELLED' },
    });
  }
}