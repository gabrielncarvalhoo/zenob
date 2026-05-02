import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { chromium } from 'playwright';

const prisma = new PrismaClient();

interface ReceiptData {
  receiptNumber: string;
  date: string;
  tenantName: string;
  cpf: string;
  propertyAddress: string;
  rentAmount: number;
  amountPaid: number;
  creditApplied: number;
  balanceBefore: number;
  balanceAfter: number;
  competencyMonth: string;
}

@Injectable()
export class PdfService {
  async generateReceiptPdf(paymentId: string): Promise<Buffer> {
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        receivable: {
          include: {
            leaseContract: {
              include: {
                unit: {
                  include: { property: true },
                },
                leaseTenants: {
                  include: { tenant: true },
                },
              },
            },
          },
        },
      },
    });

    if (!payment) {
      throw new Error('Pagamento não encontrado');
    }

    const tenant = payment.receivable.leaseContract.leaseTenants[0]?.tenant;
    const property = payment.receivable.leaseContract.unit.property;

    const receivableBalance = Number(payment.receivable.balanceAmount.toString());
    const amountPaid = Number(payment.amount.toString());
    const balanceBefore = Number((receivableBalance + amountPaid).toFixed(2));

    const receiptData: ReceiptData = {
      receiptNumber: `REC-${payment.id.slice(0, 8).toUpperCase()}`,
      date: new Date(payment.createdAt).toLocaleDateString('pt-BR'),
      tenantName: tenant?.fullName ?? 'N/A',
      cpf: tenant?.cpf ?? 'N/A',
      propertyAddress: property?.address ?? 'N/A',
      rentAmount: Number(payment.receivable.leaseContract.rentAmount.toString()),
      amountPaid,
      creditApplied: Number(payment.creditApplied?.toString() ?? 0),
      balanceBefore,
      balanceAfter: receivableBalance,
      competencyMonth: payment.receivable.competencyMonth,
    };

    const html = this.buildReceiptHtml(receiptData);

    const browser = await chromium.launch();
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle' });
    const pdfBuffer = await page.pdf({ format: 'A5', printBackground: true });
    await browser.close();

    return Buffer.from(pdfBuffer);
  }

  private buildReceiptHtml(data: ReceiptData): string {
    const formatCurrency = (v: number) =>
      v.toLocaleString('pt-BR', { minimumFractionDigits: 2 });

    const creditLine = data.creditApplied > 0
      ? `<div class="credit-note">Crédito para próximo mês: R$ ${formatCurrency(data.creditApplied)}</div>`
      : '';

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 12px; color: #1a1a1a; padding: 40px; }
    .header { text-align: center; border-bottom: 2px solid #3B6D11; padding-bottom: 16px; margin-bottom: 24px; }
    .header h1 { color: #3B6D11; font-size: 22px; margin-bottom: 4px; }
    .header p { font-size: 10px; color: #666; }
    .receipt-box { border: 1px solid #ddd; padding: 20px; max-width: 420px; margin: 0 auto; }
    .receipt-title { text-align: center; font-size: 15px; font-weight: bold; margin-bottom: 20px; color: #3B6D11; text-transform: uppercase; letter-spacing: 1px; }
    .info-row { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px dotted #ccc; }
    .info-row:last-of-type { border-bottom: none; }
    .label { color: #666; font-size: 11px; }
    .value { font-weight: bold; text-align: right; }
    .amount-box { background: #EAF3DE; padding: 12px; margin-top: 16px; text-align: center; }
    .amount-box .label { font-size: 10px; color: #27500A; text-transform: uppercase; }
    .amount-box .value { font-size: 26px; color: #27500A; font-weight: bold; }
    .credit-note { background: #FAEEDA; padding: 8px; margin-top: 12px; font-size: 11px; color: #BA7517; text-align: center; border: 1px solid #f5d9b0; }
    .footer { text-align: center; margin-top: 28px; font-size: 9px; color: #999; }
  </style>
</head>
<body>
  <div class="header">
    <h1>ZENOB</h1>
    <p>Administração de Aluguéis</p>
  </div>
  <div class="receipt-box">
    <div class="receipt-title">Recibo de Pagamento</div>
    <div class="info-row">
      <span class="label">RECIBO Nº</span>
      <span class="value">${data.receiptNumber}</span>
    </div>
    <div class="info-row">
      <span class="label">DATA DO PAGAMENTO</span>
      <span class="value">${data.date}</span>
    </div>
    <div class="info-row">
      <span class="label">MÊS DE COMPETÊNCIA</span>
      <span class="value">${data.competencyMonth}</span>
    </div>
    <div class="info-row">
      <span class="label">INQUILINO</span>
      <span class="value">${data.tenantName}</span>
    </div>
    <div class="info-row">
      <span class="label">CPF</span>
      <span class="value">${data.cpf}</span>
    </div>
    <div class="info-row">
      <span class="label">IMÓVEL</span>
      <span class="value">${data.propertyAddress}</span>
    </div>
    <div class="info-row">
      <span class="label">VALOR DO ALUGUEL</span>
      <span class="value">R$ ${formatCurrency(data.rentAmount)}</span>
    </div>
    <div class="amount-box">
      <div class="label">Valor Pago</div>
      <div class="value">R$ ${formatCurrency(data.amountPaid)}</div>
    </div>
    ${creditLine}
    <div class="info-row" style="margin-top: 14px;">
      <span class="label">SALDO ANTERIOR</span>
      <span class="value">R$ ${formatCurrency(data.balanceBefore)}</span>
    </div>
    <div class="info-row">
      <span class="label">SALDO ATUAL</span>
      <span class="value">R$ ${formatCurrency(data.balanceAfter)}</span>
    </div>
  </div>
  <div class="footer">
    Documento gerado pelo Zenob — Sistema de Administração de Aluguéis
  </div>
</body>
</html>`;
  }
}