import { Controller, Post, Body, Get, Query } from '@nestjs/common';
import { EmailService } from './email.service';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly emailService: EmailService) {}

  // Endpoint manual para testar/enviar emails avulsos
  @Post('send-email')
  async sendEmail(@Body() body: {
    to: string;
    type: 'reminder' | 'overdue' | 'renewal' | 'receipt';
    data: any;
  }) {
    switch (body.type) {
      case 'reminder':
        return this.emailService.sendPaymentReminder(body.data);
      case 'overdue':
        return this.emailService.sendOverdueNotice(body.data);
      case 'renewal':
        return this.emailService.sendContractRenewalAlert(body.data);
      case 'receipt':
        return this.emailService.sendPaymentReceipt(body.data);
      default:
        return { success: false, reason: 'tipo desconhecido' };
    }
  }

  // Enviar email de lembrete para todos os pendientes do mês
  @Post('send-reminders')
  async sendReminders() {
    const accountId = 'account-teste-001';

    const pendentes = await prisma.receivable.findMany({
      where: {
        leaseContract: { accountId },
        status: { in: ['PENDING', 'OVERDUE'] },
      },
      include: {
        leaseContract: {
          include: {
            unit: { include: { property: true } },
            leaseTenants: { include: { tenant: true } },
          },
        },
      },
    });

    const results = [];
    for (const rec of pendentes) {
      const tenant = rec.leaseContract.leaseTenants[0]?.tenant;
      if (!tenant?.email) continue;

      const amount = Number(rec.originalAmount.toString()) - Number(rec.paidAmount.toString());
      const mes = rec.competencyMonth;
      const [ano, mesNum] = mes.split('-');
      const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
      const mesFmt = `${months[parseInt(mesNum, 10) - 1]}/${ano}`;
      const dueDate = new Date(rec.dueDate).toLocaleDateString('pt-BR');

      const sent = await this.emailService.sendPaymentReminder({
        to: tenant.email,
        tenantName: tenant.fullName,
        propertyAddress: rec.leaseContract.unit.property.address,
        amount,
        dueDate,
        month: mesFmt,
      });

      results.push({ tenant: tenant.fullName, email: tenant.email, result: sent });
    }

    return { sent: results.length, results };
  }

  // Enviar aviso de vencimento de contrato (≤30 dias)
  @Post('send-renewal-alerts')
  async sendRenewalAlerts() {
    const accountId = 'account-teste-001';
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const leases = await prisma.leaseContract.findMany({
      where: {
        accountId,
        status: 'ACTIVE',
        endDate: { lte: thirtyDaysFromNow },
      },
      include: {
        unit: { include: { property: true } },
        leaseTenants: { include: { tenant: true } },
      },
    });

    const results = [];
    for (const lease of leases) {
      const tenant = lease.leaseTenants[0]?.tenant;
      if (!tenant?.email) continue;

      const daysRemaining = Math.ceil(
        (new Date(lease.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
      );
      if (daysRemaining < 0) continue;

      const sent = await this.emailService.sendContractRenewalAlert({
        to: tenant.email,
        tenantName: tenant.fullName,
        propertyAddress: lease.unit.property.address,
        endDate: new Date(lease.endDate).toLocaleDateString('pt-BR'),
        daysRemaining,
      });

      results.push({ tenant: tenant.fullName, email: tenant.email, result: sent });
    }

    return { sent: results.length, results };
  }

  // Health check
  @Get('health')
  health() {
    return {
      emailConfigured: !!process.env.RESEND_API_KEY,
      from: 'noreply@zenob.com',
    };
  }
}