import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { chromium } from 'playwright';
import { PDFDocument } from 'pdf-lib';

const prisma = new PrismaClient();

// Placeholder keys → getter functions
interface ContractData {
  NOME_INQUILINO: string;
  CPF_INQUILINO: string;
  RG_INQUILINO: string;
  EMAIL_INQUILINO: string;
  TELEFONE_INQUILINO: string;
  NOME_FIADOR: string;
  CPF_FIADOR: string;
  ENDERECO_IMOVEL: string;
  NOME_IMOVEL: string;
  CODIGO_UNIDADE: string;
  IPTU: string;
  MATRICULA_AGUA: string;
  MATRICULA_ENERGIA: string;
  VALOR_ALUGUEL: string;
  DIA_VENCIMENTO: string;
  DATA_INICIO: string;
  DATA_FIM: string;
  DURACAO_CONTRATO: string;
  NOME_LOCADOR: string;
  CPF_LOCADOR: string;
  VALOR_GARANTIA: string;
  TIPO_GARANTIA: string;
  INDICE_REAJUSTE: string;
}

@Injectable()
export class ContractPdfService {
  // Gerar PDF usando template externo (URL)
  async generateFromTemplate(leaseId: string, templateUrl: string): Promise<Buffer> {
    const contractData = await this.buildContractData(leaseId);

    // Baixa template de URL
    let templateBuffer: Buffer;
    try {
      const res = await fetch(templateUrl);
      if (!res.ok) throw new Error(`Failed to fetch template: ${res.status}`);
      const arrayBuffer = await res.arrayBuffer();
      templateBuffer = Buffer.from(arrayBuffer);
    } catch {
      // Fallback: usa template interno se URL falhar
      return this.generateInternalTemplate(leaseId);
    }

    // Substitui placeholders no PDF
    const pdfDoc = await PDFDocument.load(templateBuffer);
    const pages = pdfDoc.getPages();
    const font = await pdfDoc.embedFont('Helvetica');

    for (const page of pages) {
      const { height } = page.getSize();
      const textLines = page.getTextContent();

      // Para cada texto no PDF, tenta substituir placeholders
      for (const line of textLines) {
        const text = line.text;
        const replaced = this.replacePlaceholders(text, contractData);
        if (replaced !== text) {
          // Substitui o texto na posição original
          page.drawText(replaced, {
            x: line.transform[4],
            y: height - line.transform[5],
            font,
            size: 10,
          });
        }
      }
    }

    const pdfBytes = await pdfDoc.save();
    return Buffer.from(pdfBytes);
  }

  // Gerar PDF com template HTML interno (fallback)
  async generateContractPdf(leaseId: string): Promise<Buffer> {
    const contractData = await this.buildContractData(leaseId);
    return this.generateInternalTemplate(leaseId);
  }

  private async buildContractData(leaseId: string): Promise<ContractData> {
    const lease = await prisma.leaseContract.findUnique({
      where: { id: leaseId },
      include: {
        unit: { include: { property: true } },
        leaseTenants: {
          include: { tenant: true },
          where: { role: 'PRIMARY' },
        },
      },
    });

    if (!lease) {
      throw new Error('Contrato não encontrado');
    }

    const primaryTenant = lease.leaseTenants[0]?.tenant;
    const property = lease.unit.property;

    const formatDate = (d: Date) =>
      new Date(d).toLocaleDateString('pt-BR', { timeZone: 'UTC' });

    const formatCurrency = (v: number) =>
      v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    const calcDuration = (s: Date, e: Date) => {
      const months = Math.round((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24 * 30));
      if (months >= 12) {
        const years = Math.floor(months / 12);
        const remaining = months % 12;
        return remaining > 0 ? `${years} ano(s) e ${remaining} mês(es)` : `${years} ano(s)`;
      }
      return `${months} mês(es)`;
    };

    const getGuaranteeDescription = (type: string) => {
      switch (type) {
        case 'DEPOSIT': return 'Depósito de garantia';
        case 'SURETY': return 'Fiador';
        case 'INSURANCE': return 'Seguro fiança';
        default: return 'Sem garantia';
      }
    };

    return {
      NOME_INQUILINO: primaryTenant?.fullName ?? 'N/A',
      CPF_INQUILINO: primaryTenant?.cpf ?? 'N/A',
      RG_INQUILINO: primaryTenant?.rg ?? 'N/A',
      EMAIL_INQUILINO: primaryTenant?.email ?? 'N/A',
      TELEFONE_INQUILINO: primaryTenant?.phone ?? 'N/A',
      NOME_FIADOR: 'N/A', // TODO: buscar fiador se existir
      CPF_FIADOR: 'N/A',
      ENDERECO_IMOVEL: property.address,
      NOME_IMOVEL: property.name,
      CODIGO_UNIDADE: lease.unit.code,
      IPTU: property.iptuCode ?? 'N/A',
      MATRICULA_AGUA: property.waterRegistration ?? 'N/A',
      MATRICULA_ENERGIA: property.energyRegistration ?? 'N/A',
      VALOR_ALUGUEL: formatCurrency(Number(lease.rentAmount.toString())),
      DIA_VENCIMENTO: String(lease.dueDay),
      DATA_INICIO: formatDate(lease.startDate),
      DATA_FIM: formatDate(lease.endDate),
      DURACAO_CONTRATO: calcDuration(lease.startDate, lease.endDate),
      NOME_LOCADOR: 'Proprietário',
      CPF_LOCADOR: 'N/A',
      VALOR_GARANTIA: formatCurrency(Number(lease.depositAmount?.toString() ?? 0)),
      TIPO_GARANTIA: getGuaranteeDescription(lease.guaranteeType),
      INDICE_REAJUSTE: lease.adjustmentIndex,
    };
  }

  private replacePlaceholders(text: string, data: ContractData): string {
    let result = text;
    for (const [key, value] of Object.entries(data)) {
      result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
    }
    return result;
  }

  private async generateInternalTemplate(leaseId: string): Promise<Buffer> {
    const lease = await prisma.leaseContract.findUnique({
      where: { id: leaseId },
      include: {
        unit: { include: { property: true } },
        leaseTenants: {
          include: { tenant: true },
          where: { role: 'PRIMARY' },
        },
      },
    });

    if (!lease) {
      throw new Error('Contrato não encontrado');
    }

    const tenant = lease.leaseTenants[0]?.tenant;
    const property = lease.unit.property;

    const formatDate = (d: Date) =>
      new Date(d).toLocaleDateString('pt-BR', { timeZone: 'UTC' });

    const formatCurrency = (v: number) =>
      v.toLocaleString('pt-BR', { minimumFractionDigits: 2 });

    const calcDuration = (s: Date, e: Date) => {
      const months = Math.round((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24 * 30));
      if (months >= 12) {
        const years = Math.floor(months / 12);
        const remaining = months % 12;
        return remaining > 0 ? `${years} ano(s) e ${remaining} mês(es)` : `${years} ano(s)`;
      }
      return `${months} mês(es)`;
    };

    const contractData = {
      contractNumber: `CTR-${lease.id.slice(0, 8).toUpperCase()}`,
      propertyName: property.name,
      propertyAddress: property.address,
      iptuCode: property.iptuCode ?? '-',
      waterRegistration: property.waterRegistration ?? '-',
      energyRegistration: property.energyRegistration ?? '-',
      unitIdentifier: lease.unit.code,
      tenantName: tenant?.fullName ?? 'N/A',
      tenantCpf: tenant?.cpf ?? 'N/A',
      tenantRg: tenant?.rg ?? 'N/A',
      tenantBirthDate: tenant?.birthDate ? formatDate(new Date(tenant.birthDate)) : 'N/A',
      tenantEmail: tenant?.email ?? 'N/A',
      tenantPhone: tenant?.phone ?? 'N/A',
      landlordName: 'Proprietário',
      landlordCpf: 'N/A',
      startDate: formatDate(lease.startDate),
      endDate: formatDate(lease.endDate),
      rentAmount: Number(lease.rentAmount.toString()),
      depositAmount: Number(lease.depositAmount?.toString() ?? 0),
      dueDay: lease.dueDay,
      guaranteeType: lease.guaranteeType,
      guaranteeDescription: this.getGuaranteeDescription(lease.guaranteeType),
      adjustmentIndex: lease.adjustmentIndex,
      lateFeeType: lease.lateFeeType,
      lateFeeValue: Number(lease.lateFeeValue.toString()),
      interestType: lease.interestType,
      interestValue: Number(lease.interestValue.toString()),
      status: lease.status,
    };

    const html = this.buildContractHtml(contractData);

    const browser = await chromium.launch();
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle' });
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '20mm', bottom: '20mm', left: '25mm', right: '25mm' },
    });
    await browser.close();

    return Buffer.from(pdf);
  }

  private getGuaranteeDescription(type: string): string {
    switch (type) {
      case 'DEPOSIT': return 'Fiador com depósito de garantia equivalentes a 3 meses de aluguel.';
      case 'SURETY': return 'Fiador pessoa física ou jurídica com capacidade financeira comprovada.';
      case 'INSURANCE': return 'Seguro fiança contratado junto a seguradora autorizada.';
      case 'NONE': return 'Sem garantia adicional.';
      default: return '-';
    }
  }

  private buildContractHtml(data: any): string {
    const formatCurrency = (v: number) =>
      v.toLocaleString('pt-BR', { minimumFractionDigits: 2 });

    const guaranteeClause = data.guaranteeType !== 'NONE'
      ? `<p style="margin-bottom: 8px;"><strong>GARANTIA:</strong> ${data.guaranteeDescription}</p>`
      : '';

    const adjustmentClause = data.adjustmentIndex !== 'NONE'
      ? `<p style="margin-bottom: 8px;"><strong>REAJUSTE:</strong> O aluguel será reajustado anualmente pelo índice ${data.adjustmentIndex}.</p>`
      : '';

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Georgia', 'Times New Roman', serif;
      font-size: 11px;
      line-height: 1.6;
      color: #1a1a1a;
      padding: 0;
    }
    .page { padding: 20mm 25mm; max-width: 100%; }
    .header { text-align: center; border-bottom: 2px solid #3B6D11; padding-bottom: 12px; margin-bottom: 20px; }
    .header h1 { color: #3B6D11; font-size: 18px; margin-bottom: 2px; }
    .header p { font-size: 9px; color: #666; }
    .contract-title { text-align: center; font-size: 14px; font-weight: bold; margin-bottom: 20px; text-transform: uppercase; letter-spacing: 1px; }
    .section { margin-bottom: 16px; }
    .section-title { font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; color: #3B6D11; border-bottom: 1px solid #3B6D11; padding-bottom: 3px; margin-bottom: 8px; font-family: Arial, sans-serif; }
    .section p { margin-bottom: 6px; text-align: justify; }
    .data-table { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
    .data-table td { padding: 3px 6px; vertical-text: top; }
    .data-table td:first-child { font-weight: bold; width: 35%; color: #555; }
    .signatures { margin-top: 40px; page-break-inside: avoid; }
    .signatures-title { text-align: center; font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; color: #666; margin-bottom: 20px; border-top: 1px solid #ccc; padding-top: 12px; }
    .sign-boxes { display: flex; justify-content: space-between; gap: 40px; }
    .sign-box { flex: 1; text-align: center; }
    .sign-line { border-top: 1px solid #333; margin-top: 40px; padding-top: 4px; font-size: 9px; color: #666; }
    .footer { text-align: center; margin-top: 30px; font-size: 8px; color: #999; }
  </style>
</head>
<body>
  <div class="page">
    <div class="header">
      <h1>ZENOB</h1>
      <p>Sistema de Administração de Aluguéis — Contrato de Locação</p>
    </div>

    <div class="contract-title">CONTRATO DE LOCAÇÃO Nº ${data.contractNumber}</div>

    <div class="section">
      <div class="section-title">1. DAS PARTES</div>
      <p>
        <strong>LOCADOR:</strong> ${data.landlordName}, CPF/CNPJ ${data.landlordCpf}, propietario do imóvel objeto deste contrato.<br/>
        <strong>LOCATÁRIO:</strong> ${data.tenantName}, CPF ${data.tenantCpf}, RG ${data.tenantRg}, nascido em ${data.tenantBirthDate}, telefone ${data.tenantPhone}, e-mail ${data.tenantEmail}.
      </p>
    </div>

    <div class="section">
      <div class="section-title">2. DO IMÓVEL</div>
      <table class="data-table">
        <tr><td>Imóvel</td><td>${data.propertyName}</td></tr>
        <tr><td>Endereço</td><td>${data.propertyAddress}</td></tr>
        <tr><td>Unidade</td><td>${data.unitIdentifier}</td></tr>
        <tr><td>Inscrição IPTU</td><td>${data.iptuCode}</td></tr>
        <tr><td>Matrícula Água (CAGEPA)</td><td>${data.waterRegistration}</td></tr>
        <tr><td>Matrícula Energia (ENERGISA)</td><td>${data.energyRegistration}</td></tr>
      </table>
    </div>

    <div class="section">
      <div class="section-title">3. DA VIGÊNCIA</div>
      <p>O presente contrato tem início em <strong>${data.startDate}</strong> e término em <strong>${data.endDate}</strong>, com duração de ${this.calcDuration(data.startDate, data.endDate)}, podendo ser renovado mediante celebração de novo instrumento.</p>
    </div>

    <div class="section">
      <div class="section-title">4. DO ALUGUEL E REAJUSTE</div>
      <table class="data-table">
        <tr><td>Valor do aluguel</td><td>R$ ${formatCurrency(data.rentAmount)}</td></tr>
        <tr><td>Dia do vencimento</td><td>Dia ${data.dueDay} de cada mês</td></tr>
        <tr><td>Depósito de garantia</td><td>R$ ${formatCurrency(data.depositAmount)}</td></tr>
        ${data.adjustmentIndex !== 'NONE' ? `<tr><td>Índice de reajuste</td><td>${data.adjustmentIndex}</td></tr>` : ''}
      </table>
      ${adjustmentClause}
    </div>

    <div class="section">
      <div class="section-title">5. DA GARANTIA</div>
      ${guaranteeClause}
    </div>

    <div class="section">
      <div class="section-title">6. DAS PENALIDADES</div>
      <p style="margin-bottom: 8px;"><strong>MULTAS:</strong> Em caso de atraso no pagamento, incidirá multa de ${data.lateFeeType === 'PERCENT' ? data.lateFeeValue + '%' : 'R$ ' + formatCurrency(data.lateFeeValue)} sobre o valor do aluguel em atraso.</p>
      <p><strong>JUROS:</strong> Após o vencimento, incidirão juros de ${data.interestType === 'DAILY' ? '0,033% ao dia' : data.interestValue + '% ao mês'} sobre o valor corrigido.</p>
    </div>

    <div class="section">
      <div class="section-title">7. DAS OBRIGAÇÕES DO LOCATÁRIO</div>
      <p style="margin-bottom: 8px;">O LOCATÁRIO compromete-se a: (i) pagar o aluguel nos vencimentos pactuados; (ii) usar o imóvel exclusivamente para fins residenciais; (iii) zelar pela conservação e manutenção do imóvel; (iv) não realizar modificações sem consentimento por escrito do LOCADOR; (v) permitir visitas do LOCADOR ou seus representante legais mediante prévia combinação.</p>
    </div>

    <div class="section">
      <div class="section-title">8. DA RESCISÃO</div>
      <p style="margin-bottom: 8px;">O inadimplemento de qualquer cláusula por parte do LOCATÁRIO autoriza o LOCADOR a rescindir o contrato de imediato, sem prejuízo da cobrança de valores vencidos e multa contratual.</p>
      <p>O LOCATÁRIO poderá resiliar o contrato mediante aviso prévio de 30 dias e pagamento de multa equivalente a um mês de aluguel.</p>
    </div>

    <div class="signatures">
      <div class="sign-boxes">
        <div class="sign-box">
          <div class="sign-line">LOCADOR — ${data.landlordName}</div>
        </div>
        <div class="sign-box">
          <div class="sign-line">LOCATÁRIO — ${data.tenantName}</div>
        </div>
      </div>
    </div>

    <div class="footer">
      Contrato gerado pelo Zenob — Sistema de Administração de Aluguéis — Documento sem força legal sem assinaturas
    </div>
  </div>
</body>
</html>`;
  }

  private calcDuration(start: string, end: string): string {
    const s = new Date(start + 'T00:00:00');
    const e = new Date(end + 'T00:00:00');
    const months = Math.round((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24 * 30));
    if (months >= 12) {
      const years = Math.floor(months / 12);
      const remaining = months % 12;
      return remaining > 0 ? `${years} ano(s) e ${remaining} mês(es)` : `${years} ano(s)`;
    }
    return `${months} mês(es)`;
  }
}