import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

@Injectable()
export class DashboardService {

  async getKpis(accountId: string) {
    const agora = new Date();
    const competencyMonth = `${agora.getFullYear()}-${String(agora.getMonth() + 1).padStart(2, '0')}`;

    // KPI 1 — A receber no mês atual (PENDING)
    const aReceberResult = await prisma.receivable.aggregate({
      where: {
        leaseContract: { accountId },
        competencyMonth,
        status: 'PENDING',
      },
      _sum: { originalAmount: true },
      _count: { id: true },
    });

    // KPI 2 — Recebido no mês atual (PAID + PARTIAL)
    const recebidoResult = await prisma.receivable.aggregate({
      where: {
        leaseContract: { accountId },
        competencyMonth,
        status: { in: ['PAID', 'PARTIAL'] },
      },
      _sum: { paidAmount: true },
      _count: { id: true },
    });

    // KPI 3 — Inadimplência (OVERDUE — qualquer mês)
    const inadimplenciaResult = await prisma.receivable.aggregate({
      where: {
        leaseContract: { accountId },
        status: 'OVERDUE',
      },
      _sum: { balanceAmount: true },
      _count: { id: true },
    });

    // KPI 4 — Ocupação
    const totalUnidades = await prisma.unit.count({
      where: { property: { accountId } },
    });

    const unidadesOcupadas = await prisma.unit.count({
      where: {
        property: { accountId },
        occupancyStatus: 'OCCUPIED',
      },
    });

    // KPI 5 — Despesas do mês
    const despesasResult = await prisma.expense.aggregate({
      where: {
        accountId,
        referenceMonth: competencyMonth,
      },
      _sum: { amount: true },
      _count: { id: true },
    });

    // KPI 6 — Contratos ativos
    const contratosAtivos = await prisma.leaseContract.count({
      where: {
        accountId,
        status: 'ACTIVE',
      },
    });

    const taxaOcupacao = totalUnidades > 0
      ? Math.round((unidadesOcupadas / totalUnidades) * 100)
      : 0;

    return {
      competencyMonth,
      aReceber: {
        total: Number(aReceberResult._sum.originalAmount ?? 0),
        count: aReceberResult._count.id,
      },
      recebido: {
        total: Number(recebidoResult._sum.paidAmount ?? 0),
        count: recebidoResult._count.id,
      },
      inadimplencia: {
        total: Number(inadimplenciaResult._sum.balanceAmount ?? 0),
        count: inadimplenciaResult._count.id,
      },
      ocupacao: {
        percentual: taxaOcupacao,
        ocupadas: unidadesOcupadas,
        total: totalUnidades,
        vagas: totalUnidades - unidadesOcupadas,
      },
      despesas: {
        total: Number(despesasResult._sum.amount ?? 0),
        count: despesasResult._count.id,
      },
      contratosAtivos,
    };
  }
}
