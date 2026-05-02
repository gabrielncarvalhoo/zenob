import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface ContractTemplate {
  id: string;
  accountId: string;
  name: string;
  templateUrl: string;
  isActive: boolean;
  placeholders: string[];
}

// Marcadores padrão que Zenob suporta
export const CONTRACT_PLACEHOLDERS = [
  '{{NOME_INQUILINO}}',
  '{{CPF_INQUILINO}}',
  '{{RG_INQUILINO}}',
  '{{EMAIL_INQUILINO}}',
  '{{TELEFONE_INQUILINO}}',
  '{{NOME_FIADOR}}',
  '{{CPF_FIADOR}}',
  '{{ENDERECO_IMOVEL}}',
  '{{NOME_IMOVEL}}',
  '{{CODIGO_UNIDADE}}',
  '{{IPTU}}',
  '{{MATRICULA_AGUA}}',
  '{{MATRICULA_ENERGIA}}',
  '{{VALOR_ALUGUEL}}',
  '{{DIA_VENCIMENTO}}',
  '{{DATA_INICIO}}',
  '{{DATA_FIM}}',
  '{{DURACAO_CONTRATO}}',
  '{{NOME_LOCADOR}}',
  '{{CPF_LOCADOR}}',
  '{{VALOR_GARANTIA}}',
  '{{TIPO_GARANTIA}}',
  '{{INDICE_REAJUSTE}}',
];

@Injectable()
export class TemplatesService {
  // Listar templates da account
  async findAll(accountId: string) {
    return prisma.contractTemplate.findMany({
      where: { accountId },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Buscar template por ID
  async findOne(id: string, accountId: string) {
    const template = await prisma.contractTemplate.findFirst({
      where: { id, accountId },
    });
    if (!template) {
      throw new NotFoundException('Template não encontrado');
    }
    return template;
  }

  // Criar template
  async create(accountId: string, data: {
    name: string;
    templateUrl: string;
    placeholders?: string[];
  }) {
    // Extrai placeholders do URL (padrão {{NOME}})
    const found = (data.templateUrl.match(/\{\{[A-Z_]+\}\}/g) ?? []) as string[];
    const placeholders = found.length > 0 ? found : (data.placeholders ?? []);

    return prisma.contractTemplate.create({
      data: {
        accountId,
        name: data.name,
        templateUrl: data.templateUrl,
        isActive: true,
        placeholders,
      },
    });
  }

  // Atualizar template
  async update(id: string, accountId: string, data: {
    name?: string;
    templateUrl?: string;
    isActive?: boolean;
    placeholders?: string[];
  }) {
    const existing = await prisma.contractTemplate.findFirst({
      where: { id, accountId },
    });
    if (!existing) {
      throw new NotFoundException('Template não encontrado');
    }

    let placeholders = existing.placeholders;
    if (data.templateUrl) {
      const found = (data.templateUrl.match(/\{\{[A-Z_]+\}\}/g) ?? []) as string[];
      placeholders = found.length > 0 ? found : (data.placeholders ?? placeholders);
    } else if (data.placeholders) {
      placeholders = data.placeholders;
    }

    return prisma.contractTemplate.update({
      where: { id },
      data: {
        ...(data.name ? { name: data.name } : {}),
        ...(data.templateUrl ? { templateUrl: data.templateUrl } : {}),
        ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
        placeholders,
      },
    });
  }

  // Deletar template
  async delete(id: string, accountId: string) {
    const existing = await prisma.contractTemplate.findFirst({
      where: { id, accountId },
    });
    if (!existing) {
      throw new NotFoundException('Template não encontrado');
    }
    await prisma.contractTemplate.delete({ where: { id } });
    return { deleted: true };
  }

  // Obter placeholders suportados
  getSupportedPlaceholders() {
    return CONTRACT_PLACEHOLDERS;
  }
}