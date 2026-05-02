import { Controller, Post, Body, Get, Query, Req } from '@nestjs/common';
import { WhatsAppService } from './whatsapp.service';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

@Controller('notifications/whatsapp')
export class WhatsAppController {
  constructor(private readonly whatsappService: WhatsAppService) {}

  // GET — webhook verification (360dialog calls this to verify)
  @Get('webhook')
  async verifyWebhook(@Query('hub.verify_token') token: string, @Query('hub.challenge') challenge: string) {
    const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN ?? 'zenob-whatsapp-token';
    if (token !== verifyToken) {
      return { error: 'Token inválido' };
    }
    return challenge;
  }

  // POST — receber atualizações da Meta/360dialog
  @Post('webhook')
  async handleWebhook(@Body() body: any) {
    return this.whatsappService.handleWebhook(body);
  }

  // Enviar WhatsApp avulso
  @Post('send')
  async sendMessage(@Body() body: {
    to: string;
    type: 'reminder' | 'overdue' | 'renewal' | 'receipt' | 'text';
    data: any;
  }) {
    switch (body.type) {
      case 'reminder':
        return this.whatsappService.sendPaymentReminder(body.data);
      case 'overdue':
        return this.whatsappService.sendOverdueNotice(body.data);
      case 'renewal':
        return this.whatsappService.sendContractRenewalAlert(body.data);
      case 'receipt':
        return this.whatsappService.sendPaymentReceipt(body.data);
      case 'text':
        return this.whatsappService.sendTextMessage(body.to, body.data?.message ?? '');
      default:
        return { success: false, reason: 'tipo desconhecido' };
    }
  }

  // Enviar lembretes em batch via WhatsApp
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
      if (!tenant?.phone) continue;

      const amount = Number(rec.originalAmount.toString()) - Number(rec.paidAmount.toString());
      const mes = rec.competencyMonth;
      const [ano, mesNum] = mes.split('-');
      const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
      const mesFmt = `${months[parseInt(mesNum, 10) - 1]}/${ano}`;
      const dueDate = new Date(rec.dueDate).toLocaleDateString('pt-BR');

      const sent = await this.whatsappService.sendPaymentReminder({
        to: tenant.phone,
        tenantName: tenant.fullName,
        propertyAddress: rec.leaseContract.unit.property.address,
        amount,
        dueDate,
        month: mesFmt,
      });

      results.push({ tenant: tenant.fullName, phone: tenant.phone, result: sent });
    }

    return { sent: results.length, results };
  }

  // Enviar alertas de renovação via WhatsApp
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
      if (!tenant?.phone) continue;

      const daysRemaining = Math.ceil(
        (new Date(lease.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
      );
      if (daysRemaining < 0) continue;

      const sent = await this.whatsappService.sendContractRenewalAlert({
        to: tenant.phone,
        tenantName: tenant.fullName,
        propertyAddress: lease.unit.property.address,
        endDate: new Date(lease.endDate).toLocaleDateString('pt-BR'),
        daysRemaining,
      });

      results.push({ tenant: tenant.fullName, phone: tenant.phone, result: sent });
    }

    return { sent: results.length, results };
  }

  // Health check
  @Get('health')
  health() {
    return {
      whatsappConfigured: this.whatsappService.isConfigured(),
      provider: '360dialog',
    };
  }
}