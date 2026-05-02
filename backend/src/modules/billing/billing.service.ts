import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Marca PENDING vencido como OVERDUE na resposta sem alterar o banco
function aplicarOverdue<T extends { status: string; dueDate: Date }>(rows: T[]): T[] {
  const hoje = new Date();
  hoje.setUTCHours(0, 0, 0, 0);
  return rows.map((r) => ({
    ...r,
    status:
      r.status === 'PENDING' && new Date(r.dueDate).getTime() < hoje.getTime()
        ? 'OVERDUE'
        : r.status,
  }));
}

@Injectable()
export class BillingService {

  async findAllReceivables(
    accountId: string,
    leaseId?: string,
    limit?: number,
    tenantId?: string,
  ) {
    const rows = await prisma.receivable.findMany({
      where: {
        leaseContract: { accountId },
        ...(leaseId ? { leaseContractId: leaseId } : {}),
        ...(tenantId ? { tenantId } : {}),
      },
      orderBy: { dueDate: limit ? 'asc' : 'desc' },
      ...(limit ? { take: limit } : {}),
    });
    return aplicarOverdue(rows as any);
  }

  async findOneReceivable(id: string, accountId: string) {
    const row = await prisma.receivable.findFirst({
      where: { id, leaseContract: { accountId } },
    });
    if (!row) return null;
    return aplicarOverdue([row as any])[0];
  }

  async registerPayment(receivableId: string, accountId: string, paymentData: any) {
    const valorPago = Number(paymentData.amount);

    if (isNaN(valorPago) || valorPago <= 0) {
      throw new BadRequestException('Valor do pagamento deve ser maior que zero');
    }

    return prisma.$transaction(async (tx) => {
      const receivableAlvo = await tx.receivable.findFirst({
        where: { id: receivableId, leaseContract: { accountId } },
      });

      if (!receivableAlvo) {
        throw new NotFoundException('Cobrança não encontrada');
      }

      // Busca todos os receivables do contrato em status pagável.
      // Não filtra balanceAmount no SQL — calcula no loop a partir de original-paid
      // para evitar inconsistências de Decimal salvas em registros antigos.
      const receivables = await tx.receivable.findMany({
        where: {
          leaseContractId: receivableAlvo.leaseContractId,
          status: { in: ['PENDING', 'PARTIAL', 'OVERDUE'] },
        },
        orderBy: { dueDate: 'asc' },
      });

      let restante = valorPago;
      const pagamentosAplicados: Array<{
        receivableId: string;
        valorAplicado: number;
        status: string;
        competencyMonth: string;
      }> = [];

      const aplicarEm = async (rec: any) => {
        if (restante <= 0) return;

        const original = Number(rec.originalAmount.toString());
        const jaPago = Number(rec.paidAmount.toString());
        const saldoRec = Number((original - jaPago).toFixed(2));
        if (saldoRec <= 0) return;

        let valorAplicado = 0;
        let novoStatus: 'PAID' | 'PARTIAL' = 'PARTIAL';
        let novoPaidAt: Date | null = null;
        let novoSaldo = saldoRec;

        if (restante >= saldoRec) {
          valorAplicado = saldoRec;
          restante = Number((restante - saldoRec).toFixed(2));
          novoStatus = 'PAID';
          novoPaidAt = new Date();
          novoSaldo = 0;
        } else {
          valorAplicado = Number(restante.toFixed(2));
          novoSaldo = Number((saldoRec - valorAplicado).toFixed(2));
          restante = 0;
        }

        const novoPaidAmount = Number((jaPago + valorAplicado).toFixed(2));

        await tx.receivable.update({
          where: { id: rec.id },
          data: {
            paidAmount: novoPaidAmount.toFixed(2),
            balanceAmount: novoSaldo.toFixed(2),
            status: novoStatus,
            paidAt: novoPaidAt,
          },
        });

        pagamentosAplicados.push({
          receivableId: rec.id,
          valorAplicado,
          status: novoStatus,
          competencyMonth: rec.competencyMonth,
        });
      };

      // Fase 1 — receivables pagáveis em ordem de vencimento
      for (const rec of receivables) {
        if (restante <= 0) break;
        await aplicarEm(rec);
      }

      // Fase 2 — sobra distribui em PENDING futuros
      if (restante > 0) {
        const futuros = await tx.receivable.findMany({
          where: {
            leaseContractId: receivableAlvo.leaseContractId,
            status: 'PENDING',
            dueDate: { gt: new Date() },
          },
          orderBy: { dueDate: 'asc' },
        });
        for (const rec of futuros) {
          if (restante <= 0) break;
          await aplicarEm(rec);
        }
      }

      // Garante que sempre há um receivable em aberto enquanto contrato ACTIVE
      await this.garantirProximoReceivable(tx, receivableAlvo.leaseContractId);

      const payment = await tx.payment.create({
        data: {
          ...paymentData,
          amount: valorPago.toFixed(2),
          receivableId,
          paymentDate: paymentData.paymentDate ? new Date(paymentData.paymentDate) : new Date(),
        },
      });

      const totalDistribuido = Number((valorPago - restante).toFixed(2));
      const credito = Number(restante.toFixed(2));
      const ultimoStatus = pagamentosAplicados.length
        ? pagamentosAplicados[pagamentosAplicados.length - 1].status
        : 'PENDING';

      // Saldo restante = saldo do receivable alvo após operação
      const alvoAtualizado = await tx.receivable.findUnique({
        where: { id: receivableId },
      });
      const saldoRestanteAlvo = alvoAtualizado
        ? Number(alvoAtualizado.balanceAmount.toString())
        : 0;

      return {
        payment,
        pagamentosAplicados,
        resumo: {
          valorPago,
          totalPago: totalDistribuido,
          saldoRestante: saldoRestanteAlvo,
          credito,
          status: ultimoStatus,
        },
      };
    });
  }

  // Cria receivable do mês seguinte se contrato ACTIVE não tem nenhum em aberto
  private async garantirProximoReceivable(tx: any, leaseContractId: string) {
    const lease = await tx.leaseContract.findUnique({ where: { id: leaseContractId } });
    if (!lease || lease.status !== 'ACTIVE') return;
    if (new Date().getTime() > new Date(lease.endDate).getTime()) return;

    const aberto = await tx.receivable.count({
      where: {
        leaseContractId,
        status: { in: ['PENDING', 'PARTIAL', 'OVERDUE'] },
      },
    });
    if (aberto > 0) return;

    const ultimo = await tx.receivable.findFirst({
      where: { leaseContractId },
      orderBy: { dueDate: 'desc' },
    });
    if (!ultimo) return;

    const ud = new Date(ultimo.dueDate);
    let ano = ud.getUTCFullYear();
    let mes = ud.getUTCMonth() + 1;
    if (mes > 11) {
      mes = 0;
      ano += 1;
    }

    const diasNoMes = new Date(Date.UTC(ano, mes + 1, 0)).getUTCDate();
    const dia = Math.min(lease.dueDay, diasNoMes);
    const dueDate = new Date(Date.UTC(ano, mes, dia));
    if (dueDate.getTime() > new Date(lease.endDate).getTime()) return;

    const competencyMonth = `${ano}-${String(mes + 1).padStart(2, '0')}`;

    const existente = await tx.receivable.findFirst({
      where: { leaseContractId, competencyMonth },
    });
    if (existente) return;

    const valorStr = lease.rentAmount.toString();
    await tx.receivable.create({
      data: {
        leaseContractId,
        unitId: lease.unitId,
        tenantId: lease.primaryTenantId,
        competencyMonth,
        dueDate,
        originalAmount: valorStr,
        balanceAmount: valorStr,
        paidAmount: '0',
        status: 'PENDING',
      },
    });
  }

  async updateReceivableStatus(id: string, accountId: string, status: any) {
    return prisma.receivable.update({
      where: { id },
      data: { status },
    });
  }

  async waiveReceivable(id: string, accountId: string) {
    return prisma.receivable.update({
      where: { id },
      data: { status: 'WAIVED' },
    });
  }
}
