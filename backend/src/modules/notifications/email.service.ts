import { Injectable } from '@nestjs/common';
import { Resend } from 'resend';

@Injectable()
export class EmailService {
  private resend: Resend | null = null;
  private fromEmail = 'Zenob <noreply@zenob.com>';

  private getClient() {
    if (!this.resend) {
      if (!process.env.RESEND_API_KEY) return null;
      this.resend = new Resend(process.env.RESEND_API_KEY);
    }
    return this.resend;
  }

  async sendEmail(to: string, subject: string, html: string) {
    const client = this.getClient();
    if (!client) {
      console.warn('[EmailService] RESEND_API_KEY não configurado — email não enviado');
      return { success: false, reason: 'not configured' };
    }

    try {
      const result = await client.emails.send({
        from: this.fromEmail,
        to,
        subject,
        html,
      });
      return { success: true, id: result.data?.id };
    } catch (err) {
      console.error('[EmailService] Erro ao enviar email:', err);
      return { success: false, reason: String(err) };
    }
  }

  // ============================================================
  // Templates
  // ============================================================

  async sendPaymentReminder(data: {
    to: string;
    tenantName: string;
    propertyAddress: string;
    amount: number;
    dueDate: string;
    month: string;
  }) {
    const formattedAmount = data.amount.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; font-size: 14px; color: #1a1a1a; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; padding: 32px; }
    .header { background: #3B6D11; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .header h1 { margin: 0; font-size: 20px; }
    .body { background: #f9f9f9; padding: 24px; border-radius: 0 0 8px 8px; }
    .amount { font-size: 28px; font-weight: bold; color: #3B6D11; text-align: center; margin: 20px 0; }
    .label { color: #666; font-size: 12px; text-transform: uppercase; }
    .value { font-size: 16px; font-weight: bold; }
    .footer { text-align: center; margin-top: 20px; font-size: 11px; color: #999; }
    .cta { text-align: center; margin-top: 20px; }
    .cta a { background: #3B6D11; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>ZENOB — Lembrete de Pagamento</h1>
    </div>
    <div class="body">
      <p>Olá, <strong>${data.tenantName}</strong>.</p>
      <p>Este é um lembretefriendly do aluguel do imóvel <strong>${data.propertyAddress}</strong> referente a <strong>${data.month}</strong>.</p>
      <div class="amount">${formattedAmount}</div>
      <p>Vencimento: <strong>${data.dueDate}</strong></p>
      <div class="cta">
        <a href="${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/cobrancas">Ver detalhes no Zenob</a>
      </div>
    </div>
    <div class="footer">
      Zenob — Sistema de Administração de Aluguéis<br>
      Este é um email automático, não responda.
    </div>
  </div>
</body>
</html>`;

    return this.sendEmail(data.to, `Lembrete: aluguel ${data.month} — Vence ${data.dueDate}`, html);
  }

  async sendOverdueNotice(data: {
    to: string;
    tenantName: string;
    propertyAddress: string;
    amount: number;
    dueDate: string;
    daysLate: number;
  }) {
    const formattedAmount = data.amount.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; font-size: 14px; color: #1a1a1a; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; padding: 32px; }
    .header { background: #E24B4A; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .header h1 { margin: 0; font-size: 20px; }
    .body { background: #f9f9f9; padding: 24px; border-radius: 0 0 8px 8px; }
    .amount { font-size: 28px; font-weight: bold; color: #E24B4A; text-align: center; margin: 20px 0; }
    .alert { background: #FCEBEB; border: 1px solid #E24B4A; padding: 12px; border-radius: 4px; margin: 16px 0; }
    .footer { text-align: center; margin-top: 20px; font-size: 11px; color: #999; }
    .cta { text-align: center; margin-top: 20px; }
    .cta a { background: #E24B4A; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>ZENOB — Cobrança Vencida</h1>
    </div>
    <div class="body">
      <p>Olá, <strong>${data.tenantName}</strong>.</p>
      <div class="alert">
        Sua cobrança do imóvel <strong>${data.propertyAddress}</strong> está atrasada há <strong>${data.daysLate} dia(s)</strong>.
      </div>
      <div class="amount">${formattedAmount}</div>
      <p>Venceu em: <strong>${data.dueDate}</strong></p>
      <p>Por favor, regularize o pagamento o mais rápido possível para evitar juros e encargos.</p>
      <div class="cta">
        <a href="${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/cobrancas">Regularizar no Zenob</a>
      </div>
    </div>
    <div class="footer">
      Zenob — Sistema de Administração de Aluguéis<br>
      Este é um email automático, não responda.
    </div>
  </div>
</body>
</html>`;

    return this.sendEmail(data.to, `URGENTE: Cobrança vencida — ${formattedAmount} em atraso`, html);
  }

  async sendContractRenewalAlert(data: {
    to: string;
    tenantName: string;
    propertyAddress: string;
    endDate: string;
    daysRemaining: number;
  }) {
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; font-size: 14px; color: #1a1a1a; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; padding: 32px; }
    .header { background: #378ADD; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .header h1 { margin: 0; font-size: 20px; }
    .body { background: #f9f9f9; padding: 24px; border-radius: 0 0 8px 8px; }
    .highlight { background: #E6F1FB; border: 1px solid #378ADD; padding: 16px; border-radius: 4px; margin: 16px 0; text-align: center; }
    .highlight .days { font-size: 36px; font-weight: bold; color: #0C447C; }
    .highlight .label { font-size: 12px; color: #0C447C; }
    .footer { text-align: center; margin-top: 20px; font-size: 11px; color: #999; }
    .cta { text-align: center; margin-top: 20px; }
    .cta a { background: #378ADD; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>ZENOB — Renovação de Contrato</h1>
    </div>
    <div class="body">
      <p>Olá, <strong>${data.tenantName}</strong>.</p>
      <p>O contrato do imóvel <strong>${data.propertyAddress}</strong> vence em <strong>${data.endDate}</strong>.</p>
      <div class="highlight">
        <div class="days">${data.daysRemaining}</div>
        <div class="label">dias restantes</div>
      </div>
      <p>Entre em contato com o proprietário para combinar a renovação do contrato.</p>
      <div class="cta">
        <a href="${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/contratos">Ver contrato no Zenob</a>
      </div>
    </div>
    <div class="footer">
      Zenob — Sistema de Administração de Aluguéis<br>
      Este é um email automático, não responda.
    </div>
  </div>
</body>
</html>`;

    return this.sendEmail(
      data.to,
      `Seu contrato vence em ${data.daysRemaining} dias — ${data.propertyAddress}`,
      html,
    );
  }

  async sendPaymentReceipt(data: {
    to: string;
    tenantName: string;
    propertyAddress: string;
    amount: number;
    paymentDate: string;
    month: string;
    receiptNumber: string;
  }) {
    const formattedAmount = data.amount.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; font-size: 14px; color: #1a1a1a; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; padding: 32px; }
    .header { background: #3B6D11; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .header h1 { margin: 0; font-size: 20px; }
    .body { background: #f9f9f9; padding: 24px; border-radius: 0 0 8px 8px; }
    .success { background: #EAF3DE; border: 1px solid #3B6D11; padding: 16px; border-radius: 4px; margin: 16px 0; text-align: center; }
    .amount { font-size: 32px; font-weight: bold; color: #27500A; }
    .receipt-box { border: 1px solid #ddd; padding: 16px; margin: 16px 0; }
    .footer { text-align: center; margin-top: 20px; font-size: 11px; color: #999; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>ZENOB — Comprovante de Pagamento</h1>
    </div>
    <div class="body">
      <p>Olá, <strong>${data.tenantName}</strong>.</p>
      <p>Recebemos o pagamento do aluguel do imóvel <strong>${data.propertyAddress}</strong>.</p>
      <div class="success">
        <div>Pagamento confirmado!</div>
        <div class="amount">${formattedAmount}</div>
      </div>
      <div class="receipt-box">
        <div><strong>Recibo:</strong> ${data.receiptNumber}</div>
        <div><strong>Mês:</strong> ${data.month}</div>
        <div><strong>Data do pagamento:</strong> ${data.paymentDate}</div>
        <div><strong>Imóvel:</strong> ${data.propertyAddress}</div>
      </div>
      <p>Obrigado!</p>
    </div>
    <div class="footer">
      Zenob — Sistema de Administração de Aluguéis<br>
      Este é um email automático, não responda.
    </div>
  </div>
</body>
</html>`;

    return this.sendEmail(data.to, `Comprovante de pagamento — ${data.month}`, html);
  }
}