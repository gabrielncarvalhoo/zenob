import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

@Injectable()
export class DashboardService {

  async getKpis(accountId: string) {
    const agora = new Date();
    const competencyMonth = `${agora.getFullYear()}-${String(agora.getMonth() + 1).padStart(2, '0')}`;

    const aReceberResult = await prisma.receivable.aggregate({
      where: {
        leaseContract: { accountId },
        competencyMonth,
        status: 'PENDING',
      },
      _sum: { originalAmount: true },
      _count: { id: true },
    });

    const recebidoResult = await prisma.receivable.aggregate({
      where: {
        leaseContract: { accountId },
        competencyMonth,
        status: { in: ['PAID', 'PARTIAL'] },
      },
      _sum: { paidAmount: true },
      _count: { id: true },
    });

    const inadimplenciaResult = await prisma.receivable.aggregate({
      where: {
        leaseContract: { accountId },
        status: 'OVERDUE',
      },
      _sum: { balanceAmount: true },
      _count: { id: true },
    });

    const totalUnidades = await prisma.unit.count({
      where: { property: { accountId } },
    });

    const unidadesOcupadas = await prisma.unit.count({
      where: {
        property: { accountId },
        occupancyStatus: 'OCCUPIED',
      },
    });

    const despesasResult = await prisma.expense.aggregate({
      where: {
        accountId,
        referenceMonth: competencyMonth,
      },
      _sum: { amount: true },
      _count: { id: true },
    });

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

  // ============================================================
  // Histórico mensal — últimos 12 meses
  // ============================================================
  async getHistorical(accountId: string, months = 12) {
    const result = [];

    for (let i = months - 1; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const year = d.getFullYear();
      const month = d.getMonth() + 1;
      const cm = `${year}-${String(month).padStart(2, '0')}`;
      const months2 = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
      const label = `${months2[month - 1]}/${String(year).slice(2)}`;

      const [received, expenses, overdue] = await Promise.all([
        prisma.receivable.aggregate({
          where: {
            leaseContract: { accountId },
            competencyMonth: cm,
            status: { in: ['PAID', 'PARTIAL'] },
          },
          _sum: { paidAmount: true },
        }),
        prisma.expense.aggregate({
          where: { accountId, referenceMonth: cm },
          _sum: { amount: true },
        }),
        prisma.receivable.findMany({
          where: {
            leaseContract: { accountId },
            competencyMonth: cm,
            status: 'OVERDUE',
          },
          select: { balanceAmount: true },
        }),
      ]);

      const overdueTotal = overdue.reduce((acc, r) => acc + Number(r.balanceAmount.toString()), 0);

      result.push({
        month: cm,
        label,
        received: Number(received._sum.paidAmount ?? 0),
        expenses: Number(expenses._sum.amount ?? 0),
        overdue: overdueTotal,
      });
    }

    return result;
  }

  // ============================================================
  // Evolução de ocupação — snapshot mensal dos últimos 12 meses
  // ============================================================
  async getOccupancyHistory(accountId: string, months = 12) {
    const result = [];
    const months2 = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];

    for (let i = months - 1; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const year = d.getFullYear();
      const month = d.getMonth() + 1;
      const cm = `${year}-${String(month).padStart(2, '0')}`;
      const label = `${months2[month - 1]}/${String(year).slice(2)}`;

      // Unidades no início do mês (baseado no status atual de occupancy — para MVP usa snapshot atual)
      const [total, occupied] = await Promise.all([
        prisma.unit.count({ where: { property: { accountId } } }),
        prisma.unit.count({ where: { property: { accountId }, occupancyStatus: 'OCCUPIED' } }),
      ]);

      result.push({
        month: cm,
        label,
        total,
        occupied,
        rate: total > 0 ? Math.round((occupied / total) * 100) : 0,
      });
    }

    return result;
  }

  // ============================================================
  // Receivables por status — distribuição atual
  // ============================================================
  async getReceivablesByStatus(accountId: string) {
    const rows = await prisma.receivable.groupBy({
      by: ['status'],
      where: { leaseContract: { accountId } },
      _count: { id: true },
      _sum: { originalAmount: true },
    });

    return rows.map(r => ({
      status: r.status,
      count: r._count.id,
      total: Number(r._sum.originalAmount ?? 0),
    }));
  }

  // ============================================================
  // Despesas por categoria — mês atual
  // ============================================================
  async getExpensesByCategory(accountId: string) {
    const agora = new Date();
    const cm = `${agora.getFullYear()}-${String(agora.getMonth() + 1).padStart(2, '0')}`;

    const rows = await prisma.expense.groupBy({
      by: ['category'],
      where: { accountId, referenceMonth: cm },
      _sum: { amount: true },
    });

    return rows.map(r => ({
      category: r.category,
      total: Number(r._sum.amount ?? 0),
    }));
  }
}