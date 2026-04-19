import { Injectable } from '@nestjs/common';
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
    return prisma.payment.create({
      data: {
        ...paymentData,
        receivableId,
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
