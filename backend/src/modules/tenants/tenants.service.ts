import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

@Injectable()
export class TenantsService {

  async findAllTenants(accountId: string) {
    return prisma.tenant.findMany({
      where: { accountId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOneTenant(id: string, accountId: string) {
    return prisma.tenant.findFirst({
      where: { id, accountId },
      include: {
        leaseContracts: {
          include: {
            leaseContract: {
              include: {
                unit: {
                  include: {
                    property: { select: { id: true, name: true, address: true } }
                  }
                }
              }
            }
          }
        }
      }
    });
  }

  async createTenant(accountId: string, data: any) {
    return prisma.tenant.create({
      data: { ...data, accountId },
    });
  }

  async updateTenant(id: string, accountId: string, data: any) {
    return prisma.tenant.update({
      where: { id },
      data,
    });
  }
}
