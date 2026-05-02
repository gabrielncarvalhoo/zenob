import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

type PaymentMethod = 'PIX' | 'CASH' | 'CHECK';

interface CreateCashFlowEntry {
  tenantId: string;
  leaseContractId: string;
  competencyMonth: string; // "2026-05"
  amount: number;
  paymentMethod: PaymentMethod;
  transactionDate: string; // "YYYY-MM-DD"
  notes?: string;
}

interface ReconciliationStatus {
  competencyMonth: string;
  registered: number;
  expected: number;
  missing: number;
  entries: any[];
}

@Injectable()
export class ReconciliationService {

  // Registrar entrada manual (Pix, dinheiro, cheque)
  async registerEntry(accountId: string, data: CreateCashFlowEntry) {
    // Valida tenant pertence à account
    const tenant = await prisma.tenant.findFirst({
      where: { id: data.tenantId, accountId },
    });
    if (!tenant) {
      throw new NotFoundException('Inquilino não encontrado');
    }

    // Valida contrato pertence à account e ao tenant
    const contract = await prisma.leaseContract.findFirst({
      where: {
        id: data.leaseContractId,
        accountId,
        leaseTenants: { some: { tenantId: data.tenantId } },
      },
    });
    if (!contract) {
      throw new NotFoundException('Contrato não encontrado ou inquilino não vinculado');
    }

    // Verifica se existe cobrança aberta para este contrato + competência
    let matchedReceivableId: string | null = null;
    const receivable = await prisma.receivable.findFirst({
      where: {
        leaseContractId: data.leaseContractId,
        competencyMonth: data.competencyMonth,
      },
    });

    if (receivable) {
      matchedReceivableId = receivable.id;

      // Atualiza a cobrança como paga (se valor bate)
      const paidAmount = receivable.paidAmount ? Number(receivable.paidAmount) : 0;
      const originalAmount = Number(receivable.originalAmount);
      const newPaidAmount = paidAmount + data.amount;

      if (newPaidAmount >= originalAmount) {
        await prisma.receivable.update({
          where: { id: receivable.id },
          data: {
            status: 'PAID',
            paidAmount: originalAmount,
            balanceAmount: 0,
            paidAt: new Date(data.transactionDate),
          },
        });
      } else {
        await prisma.receivable.update({
          where: { id: receivable.id },
          data: {
            status: 'PARTIAL',
            paidAmount: newPaidAmount,
            balanceAmount: originalAmount - newPaidAmount,
          },
        });
      }
    }

    // Cria entrada de fluxo
    const entry = await prisma.cashFlowEntry.create({
      data: {
        accountId,
        tenantId: data.tenantId,
        leaseContractId: data.leaseContractId,
        competencyMonth: data.competencyMonth,
        amount: data.amount,
        paymentMethod: data.paymentMethod,
        transactionDate: new Date(data.transactionDate),
        matchedReceivableId,
        notes: data.notes ?? null,
      },
    });

    return entry;
  }

  // Listar entradas de fluxo por competência
  async listEntries(accountId: string, competencyMonth?: string) {
    return prisma.cashFlowEntry.findMany({
      where: {
        accountId,
        ...(competencyMonth ? { competencyMonth } : {}),
      },
      include: {
        tenant: { select: { id: true, fullName: true } },
        leaseContract: {
          select: {
            id: true,
            unitId: true,
            unit: { select: { code: true, property: { select: { name: true, address: true } } } },
          },
        },
        matchedReceivableId: false,
      },
      orderBy: { transactionDate: 'desc' },
    });
  }

  // Status de reconciliação por competência
  async getReconciliationStatus(accountId: string, competencyMonth: string) {
    // Entradas registradas neste mês
    const entries = await prisma.cashFlowEntry.findMany({
      where: { accountId, competencyMonth },
      include: {
        tenant: { select: { id: true, fullName: true } },
        leaseContract: {
          select: {
            id: true,
            rentAmount: true,
            unit: { select: { code: true } },
          },
        },
      },
    });

    // Contratos ativos com cobrança esperada
    const contracts = await prisma.leaseContract.findMany({
      where: { accountId, status: 'ACTIVE' },
      include: {
        leaseTenants: {
          where: { role: 'PRIMARY' },
          include: { tenant: { select: { id: true, fullName: true } } },
        },
        unit: { select: { id: true, code: true, property: { select: { name: true } } } },
        receivables: {
          where: { competencyMonth },
        },
      },
    });

    const registered = entries.reduce((acc, e) => acc + Number(e.amount), 0);

    const expectedEntries = contracts.map(c => {
      const entry = entries.find(e => e.leaseContractId === c.id);
      const receivable = c.receivables[0];
      return {
        contractId: c.id,
        tenant: c.leaseTenants[0]?.tenant.fullName ?? 'N/A',
        expectedAmount: Number(c.rentAmount),
        paidAmount: entry ? Number(entry.amount) : 0,
        isPaid: !!entry || (receivable?.status === 'PAID'),
        isPartial: entry && Number(entry.amount) < Number(c.rentAmount),
        matched: !!entry,
      };
    });

    const missing = expectedEntries.filter(e => !e.matched);

    return {
      competencyMonth,
      registered,
      expected: expectedEntries.reduce((acc, e) => acc + e.expectedAmount, 0),
      totalContracts: expectedEntries.length,
      paidContracts: expectedEntries.filter(e => e.matched || e.isPaid).length,
      missingContracts: missing.length,
      entries: expectedEntries,
    };
  }

  // Deletar entrada (estorno)
  async deleteEntry(id: string, accountId: string) {
    const entry = await prisma.cashFlowEntry.findFirst({
      where: { id, accountId },
    });
    if (!entry) {
      throw new NotFoundException('Entrada não encontrada');
    }

    // Se tinha cobrança vinculada, reverte status
    if (entry.matchedReceivableId) {
      const receivable = await prisma.receivable.findUnique({
        where: { id: entry.matchedReceivableId },
      });
      if (receivable) {
        const originalPaid = Number(receivable.paidAmount) - entry.amount;
        if (originalPaid <= 0) {
          await prisma.receivable.update({
            where: { id: receivable.id },
            data: { status: 'PENDING', paidAmount: 0, balanceAmount: receivable.originalAmount },
          });
        } else {
          await prisma.receivable.update({
            where: { id: receivable.id },
            data: {
              status: 'PARTIAL',
              paidAmount: originalPaid,
              balanceAmount: Number(receivable.originalAmount) - originalPaid,
            },
          });
        }
      }
    }

    await prisma.cashFlowEntry.delete({ where: { id } });
    return { deleted: true };
  }
}