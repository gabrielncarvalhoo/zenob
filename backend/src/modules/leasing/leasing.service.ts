import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

@Injectable()
export class LeasingService {

  async findAllContracts(accountId: string) {
    return prisma.leaseContract.findMany({
      where: { accountId },
      orderBy: { createdAt: 'desc' },
      include: {
        unit: {
          include: {
            property: { select: { id: true, name: true, address: true } }
          }
        },
        leaseTenants: {
          include: {
            tenant: { select: { id: true, fullName: true, email: true, phone: true } }
          }
        }
      }
    });
  }

  async findOneContract(id: string, accountId: string) {
    return prisma.leaseContract.findFirst({
      where: { id, accountId },
      include: {
        unit: {
          include: {
            property: {
              select: {
                id: true, name: true, address: true,
                iptuCode: true, waterRegistration: true, energyRegistration: true
              }
            }
          }
        },
        leaseTenants: {
          include: {
            tenant: { select: { id: true, fullName: true, email: true, phone: true, cpf: true } }
          }
        }
      }
    });
  }

  async createContract(accountId: string, data: any) {
    const contract = await prisma.leaseContract.create({
      data: {
        lateFeeType: 'PERCENT',
        lateFeeValue: 2,
        interestType: 'MONTHLY',
        interestValue: 1,
        ...data,
        accountId,
      },
    });

    // Cria o vínculo do inquilino principal
    if (data.primaryTenantId) {
      await prisma.leaseTenant.create({
        data: {
          leaseContractId: contract.id,
          tenantId: data.primaryTenantId,
          role: 'PRIMARY',
        },
      });
    }

    return contract;
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
