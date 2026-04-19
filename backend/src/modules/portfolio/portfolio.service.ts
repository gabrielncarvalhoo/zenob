import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

@Injectable()
export class PortfolioService {

  async findAllProperties(accountId: string) {
    return prisma.property.findMany({
      where: { accountId },
      include: { units: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOneProperty(id: string, accountId: string) {
    return prisma.property.findFirst({
      where: { id, accountId },
      include: { units: true },
    });
  }

  async createProperty(accountId: string, data: any) {
    return prisma.property.create({
      data: { ...data, accountId },
    });
  }

  async updateProperty(id: string, accountId: string, data: any) {
    return prisma.property.update({
      where: { id },
      data,
    });
  }

  async findAllUnits(propertyId: string) {
    return prisma.unit.findMany({
      where: { propertyId },
      orderBy: { code: 'asc' },
    });
  }

  async createUnit(propertyId: string, data: any) {
    return prisma.unit.create({
      data: { ...data, propertyId },
    });
  }
}
