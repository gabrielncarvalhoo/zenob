import { Injectable } from '@nestjs/common';

interface WhatsAppConfig {
  phoneNumberId: string;
  apiKey: string;
  businessAccountId: string;
}

@Injectable()
export class WhatsAppService {
  private config: WhatsAppConfig | null = null;
  private readonly BASE_URL = 'https://api.360dialog.io/v1';

  private getConfig(): WhatsAppConfig | null {
    if (this.config) return this.config;
    if (!process.env.WHATSAPP_PHONE_NUMBER_ID || !process.env.WHATSAPP_API_KEY) {
      return null;
    }
    this.config = {
      phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
      apiKey: process.env.WHATSAPP_API_KEY,
      businessAccountId: process.env.WHATSAPP_BUSINESS_ACCOUNT_ID ?? '',
    };
    return this.config;
  }

  private async sendRequest(endpoint: string, body: any): Promise<any> {
    const cfg = this.getConfig();
    if (!cfg) {
      return { success: false, reason: 'WhatsApp não configurado' };
    }

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${cfg.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();
      if (!response.ok) {
        return { success: false, reason: data };
      }
      return { success: true, data };
    } catch (err) {
      return { success: false, reason: String(err) };
    }
  }

  private get baseUrl(): string {
    return this.BASE_URL;
  }

  // ============================================================
  // Envio de mensagens via template
  // ============================================================

  async sendTextMessage(to: string, message: string) {
    const cfg = this.getConfig();
    if (!cfg) {
      console.warn('[WhatsAppService] Não configurado — mensagem não enviada');
      return { success: false, reason: 'not configured' };
    }

    // Formata número: tudo depois do último @ se for email, ou só número
    const phone = to.replace(/\D/g, '');

    return this.sendRequest('/messages', {
      to,
      type: 'text',
      text: { body: message },
    });
  }

  async sendTemplateMessage(to: string, templateName: string, components: any[]) {
    const cfg = this.getConfig();
    if (!cfg) {
      return { success: false, reason: 'not configured' };
    }

    const phone = to.replace(/\D/g, '');

    return this.sendRequest('/messages', {
      to,
      type: 'template',
      template: {
        name: templateName,
        language: { code: 'pt_BR' },
        components,
      },
    });
  }

  // ============================================================
  // Templates pre-definidos (usam sendTemplateMessage)
  // ============================================================

  async sendPaymentReminder(data: {
    to: string;
    tenantName: string;
    amount: number;
    dueDate: string;
    month: string;
    propertyAddress: string;
  }) {
    const formattedAmount = data.amount.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });

    const message = `🏠 *Zenob — Lembrete de Pagamento*

Olá, ${data.tenantName}!

Este é um lembrete do aluguel do imóvel ${data.propertyAddress} referente a *${data.month}*.

💰 Valor: *${formattedAmount}*
📅 Vencimento: ${data.dueDate}

Acesse o Zenob para ver os detalhes e pagar:
${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/cobrancas

—
Zenob — Administração de Aluguéis`;

    return this.sendTextMessage(data.to, message);
  }

  async sendOverdueNotice(data: {
    to: string;
    tenantName: string;
    amount: number;
    dueDate: string;
    daysLate: number;
    propertyAddress: string;
  }) {
    const formattedAmount = data.amount.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });

    const message = `⚠️ *Zenob — Cobrança Vencida*

Olá, ${data.tenantName}!

Sua cobrança do imóvel *${data.propertyAddress}* está atrasada há *${data.daysLate} dia(s)*.

💰 Valor em atraso: *${formattedAmount}*
📅 Venceu em: ${data.dueDate}

Por favor, regularize o pagamento o mais rápido possível para evitar juros e encargos.

🔗 Regularize agora:
${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/cobrancas

—
Zenob — Administração de Aluguéis`;

    return this.sendTextMessage(data.to, message);
  }

  async sendContractRenewalAlert(data: {
    to: string;
    tenantName: string;
    propertyAddress: string;
    endDate: string;
    daysRemaining: number;
  }) {
    const message = `📋 *Zenob — Renovação de Contrato*

Olá, ${data.tenantName}!

O contrato do imóvel *${data.propertyAddress}* vence em *${data.endDate}*.

⏰ Restam *${data.daysRemaining} dia(s)* para o término.

Entre em contato com o proprietário para combinar a renovação.

🔗 Ver contrato:
${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/contratos

—
Zenob — Administração de Aluguéis`;

    return this.sendTextMessage(data.to, message);
  }

  async sendPaymentReceipt(data: {
    to: string;
    tenantName: string;
    amount: number;
    paymentDate: string;
    month: string;
    propertyAddress: string;
    receiptNumber: string;
  }) {
    const formattedAmount = data.amount.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });

    const message = `✅ *Zenob — Pagamento Confirmado*

Olá, ${data.tenantName}!

Recebemos o pagamento do imóvel *${data.propertyAddress}*.

💰 Valor: *${formattedAmount}*
📅 Mês: ${data.month}
📆 Data do pagamento: ${data.paymentDate}
🧾 Recibo: ${data.receiptNumber}

Obrigado!

—
Zenob — Administração de Aluguéis`;

    return this.sendTextMessage(data.to, message);
  }

  // ============================================================
  // Webhook endpoint — receber status de entrega
  // ============================================================

  async handleWebhook(body: any) {
    const entry = body?.entry?.[0];
    const changes = entry?.changes?.[0];
    const message = changes?.value?.messages?.[0];

    if (message) {
      return {
        from: message.from,
        messageId: message.id,
        type: message.type,
        timestamp: message.timestamp,
      };
    }

    const statusUpdate = changes?.value?.statuses?.[0];
    if (statusUpdate) {
      return {
        id: statusUpdate.id,
        status: statusUpdate.status,
        timestamp: statusUpdate.timestamp,
      };
    }

    return { received: true };
  }

  // Health
  isConfigured(): boolean {
    return !!this.getConfig();
  }
}