import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

@Injectable()
export class BillingService {

  async findAllReceivables(accountId: string) {
    return prisma.receivable.findMany({
      where: { leaseContract: { accountId } },
      orderBy: { dueDate: 'desc' },
    });
  }

  async findOneReceivable(id: string, accountId: string) {
    return prisma.receivable.findFirst({
      where: { id, leaseContract: { accountId } },
    });
  }

  async registerPayment(receivableId: string, accountId: string, paymentData: any) {
    // Valida valor do pagamento antes de qualquer operação no banco
    const valorPago = parseFloat(paymentData.amount);

    if (isNaN(valorPago) || valorPago <= 0) {
      throw new BadRequestException('Valor do pagamento deve ser maior que zero');
    }

    // Transação garante atomicidade entre leitura, criação do payment e update do receivable
    return prisma.$transaction(async (tx) => {
      const receivable = await tx.receivable.findFirst({
        where: { id: receivableId, leaseContract: { accountId } },
      });

      if (!receivable) {
        throw new NotFoundException('Cobrança não encontrada');
      }

      const saldoAtual = parseFloat(
        receivable.balanceAmount?.toString() || receivable.originalAmount.toString(),
      );
      const totalPagoAntes = parseFloat(receivable.paidAmount?.toString() || '0');
      const totalPagoAgora = totalPagoAntes + valorPago;
      const novoSaldo = saldoAtual - valorPago;

      // novoSaldo <= 0 cobre pagamento integral e a maior (gera crédito)
      const novoStatus = novoSaldo <= 0 ? 'PAID' : 'PARTIAL';

      const payment = await tx.payment.create({
        data: {
          ...paymentData,
          amount: valorPago,
          receivableId,
        },
      });

      await tx.receivable.update({
        where: { id: receivableId },
        data: {
          paidAmount: totalPagoAgora,
          balanceAmount: novoSaldo < 0 ? 0 : novoSaldo,
          status: novoStatus as any,
          paidAt: novoStatus === 'PAID' ? new Date() : undefined,
        },
      });

      return {
        payment,
        resumo: {
          valorPago,
          totalPago: totalPagoAgora,
          saldoRestante: novoSaldo < 0 ? 0 : novoSaldo,
          credito: novoSaldo < 0 ? Math.abs(novoSaldo) : 0,
          status: novoStatus,
        },
      };
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
