import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

@Injectable()
export class LeasingService {

  async findAllContracts(accountId: string) {
    return prisma.leaseContract.findMany({
      where: { accountId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOneContract(id: string, accountId: string) {
    return prisma.leaseContract.findFirst({
      where: { id, accountId },
    });
  }

  async createContract(accountId: string, data: any) {
    return prisma.leaseContract.create({
      data: { ...data, accountId },
    });
  }

  async updateContractStatus(id: string, accountId: string, status: any) {
    return prisma.leaseContract.update({
      where: { id },
      data: { status },
    });
  }

  async terminateContract(id: string, accountId: string, terminationData: any) {
    return prisma.leaseContract.update({
      where: { id },
      data: {
        status: 'TERMINATED',
        terminationDate: terminationData.terminationDate || new Date(),
        terminationReason: terminationData.terminationReason,
      },
    });
  }
}
