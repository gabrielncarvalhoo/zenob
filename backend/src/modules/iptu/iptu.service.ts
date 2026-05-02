import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

type IptuStatus = 'PAID' | 'PENDING' | 'NOT_FOUND' | 'UNKNOWN';

interface ScrapeResult {
  status: IptuStatus;
  rawMessage: string;
  checkedAt: Date;
}

@Injectable()
export class IptuService {
  // Check IPTU status via web scraping
  // URL real: https://ecidadeonline.campinagrande.pb.gov.br/digitamatricula.php?inscricao=CODIGO
  // Mensagem de "sem débitos": "Nenhum débito pendente encontrado para a matrícula X"
  async checkIptuStatus(iptuCode: string): Promise<ScrapeResult> {
    if (!iptuCode || iptuCode.trim() === '') {
      return { status: 'NOT_FOUND', rawMessage: 'Código IPTU não informado', checkedAt: new Date() };
    }

    const checkUrl = 'https://ecidadeonline.campinagrande.pb.gov.br/digitamatricula.php';

    try {
      // Site exige POST com matricula no body (form urlencoded)
      const response = await fetch(checkUrl, {
        method: 'POST',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'text/html,application/xhtml+xml',
          'Accept-Language': 'pt-BR,pt;q=0.9',
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `matricula=${encodeURIComponent(iptuCode.trim())}`,
      });

      if (!response.ok) {
        return { status: 'NOT_FOUND', rawMessage: `HTTP ${response.status}`, checkedAt: new Date() };
      }

      // Decodifica HTML entities mais comuns para detectar string com acentos
      const raw = await response.text();
      const html = raw
        .replace(/&eacute;/g, 'é')
        .replace(/&iacute;/g, 'í')
        .replace(/&aacute;/g, 'á')
        .replace(/&oacute;/g, 'ó')
        .replace(/&uacute;/g, 'ú')
        .replace(/&atilde;/g, 'ã')
        .replace(/&ccedil;/g, 'ç');

      // Matrícula inexistente
      if (html.includes('Matrícula não encontrada') ||
          html.includes('Matrícula inválida') ||
          html.includes('matrícula não cadastrada')) {
        return { status: 'NOT_FOUND', rawMessage: 'Matrícula não encontrada', checkedAt: new Date() };
      }

      // String oficial de quitação
      if (html.includes('Nenhum débito pendente encontrado')) {
        return { status: 'PAID', rawMessage: 'Nenhum débito pendente encontrado', checkedAt: new Date() };
      }

      // Caso contrário considera pendente
      return { status: 'PENDING', rawMessage: 'Débito pendente', checkedAt: new Date() };
    } catch (error) {
      return { status: 'NOT_FOUND', rawMessage: `Erro de acesso: ${error}`, checkedAt: new Date() };
    }
  }

  // Verifica IPTU de um imóvel específico e atualiza status
  async verifyProperty(propertyId: string, accountId: string) {
    const property = await prisma.property.findFirst({
      where: { id: propertyId, accountId },
    });
    if (!property) {
      return { error: 'Imóvel não encontrado', iptuStatus: null };
    }
    if (!property.iptuCode) {
      return { error: 'Imóvel sem código IPTU', iptuStatus: 'NOT_FOUND' };
    }

    const result = await this.checkIptuStatus(property.iptuCode);
    await prisma.property.update({
      where: { id: propertyId },
      data: { iptuStatus: result.status, iptuLastChecked: result.checkedAt },
    });

    return {
      propertyId,
      iptuCode: property.iptuCode,
      iptuStatus: result.status,
      rawMessage: result.rawMessage,
      checkedAt: result.checkedAt,
    };
  }

  // Update property IPTU status
  async updatePropertyIptuStatus(propertyId: string, accountId: string, status: IptuStatus, rawMessage?: string) {
    const property = await prisma.property.findFirst({
      where: { id: propertyId, accountId },
    });
    if (!property) return null;

    return prisma.property.update({
      where: { id: propertyId },
      data: {
        iptuStatus: status,
        iptuLastChecked: new Date(),
      },
    });
  }

  // Get all properties with IPTU status (for dashboard)
  async getPropertiesIptuStatus(accountId: string) {
    const properties = await prisma.property.findMany({
      where: { accountId },
      select: {
        id: true,
        name: true,
        iptuCode: true,
        iptuStatus: true,
        iptuLastChecked: true,
        address: true,
      },
      orderBy: { name: 'asc' },
    });

    return {
      total: properties.length,
      paid: properties.filter(p => p.iptuStatus === 'PAID').length,
      pending: properties.filter(p => p.iptuStatus === 'PENDING').length,
      unknown: properties.filter(p => p.iptuStatus === 'UNKNOWN' || !p.iptuStatus).length,
      properties,
    };
  }

  // Batch check all properties with IPTU code
  async batchCheckAll(accountId: string) {
    const properties = await prisma.property.findMany({
      where: { accountId, iptuCode: { not: null } },
    });

    const results = [];
    for (const property of properties) {
      if (!property.iptuCode) continue;

      const result = await this.checkIptuStatus(property.iptuCode);
      await this.updatePropertyIptuStatus(property.id, accountId, result.status, result.rawMessage);

      results.push({
        propertyId: property.id,
        propertyName: property.name,
        iptuCode: property.iptuCode,
        status: result.status,
      });

      // Rate limit: 1 request per second to avoid blocking
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    return results;
  }

  // Auto-check based on schedule:
  // - Jan-Jun: every 10 days
  // - Jul-Dec: monthly
  // - Jan 10 reset: all properties set to UNKNOWN
  async scheduledCheck(accountId: string) {
    const now = new Date();
    const month = now.getMonth(); // 0-11

    // January (month 0) after day 10: reset all to UNKNOWN
    if (month === 0 && now.getDate() >= 10) {
      await prisma.property.updateMany({
        where: { accountId },
        data: { iptuStatus: 'UNKNOWN' },
      });
      return { action: 'RESET', count: 0 };
    }

    // If no IPTU code, skip
    const propertiesWithCode = await prisma.property.count({
      where: { accountId, iptuCode: { not: null } },
    });

    if (propertiesWithCode === 0) {
      return { action: 'SKIP', count: 0 };
    }

    // Run batch check
    const results = await this.batchCheckAll(accountId);
    return { action: 'CHECKED', count: results.length };
  }

  // Manual confirm payment
  async confirmPayment(propertyId: string, accountId: string) {
    return prisma.property.update({
      where: { id: propertyId },
      data: {
        iptuStatus: 'PAID',
        iptuLastChecked: new Date(),
      },
    });
  }

  // Get IPTU dashboard for dashboard page
  async getDashboardSummary(accountId: string) {
    const stats = await this.getPropertiesIptuStatus(accountId);
    const pending = stats.properties.filter(p => p.iptuStatus === 'PENDING' || p.iptuStatus === 'UNKNOWN');

    return {
      totalProperties: stats.total,
      paidCount: stats.paid,
      pendingCount: stats.pending,
      unknownCount: stats.unknown,
      alertCount: pending.length,
      properties: pending.slice(0, 10).map(p => ({
        id: p.id,
        name: p.name,
        iptuCode: p.iptuCode,
        status: p.iptuStatus ?? 'UNKNOWN',
        lastChecked: p.iptuLastChecked?.toISOString() ?? null,
      })),
    };
  }
}