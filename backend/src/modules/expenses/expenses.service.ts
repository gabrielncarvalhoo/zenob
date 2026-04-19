import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

@Injectable()
export class ExpensesService {

  async findAll(accountId: string, filters: {
    propertyId?: string;
    isPaid?: boolean;
    category?: string;
  }) {
    return prisma.expense.findMany({
      where: {
        accountId,
        ...(filters.propertyId && { propertyId: filters.propertyId }),
        ...(filters.isPaid !== undefined && { isPaid: filters.isPaid }),
        ...(filters.category && { category: filters.category as any }),
      },
      include: {
        property: { select: { name: true } },
        unit: { select: { code: true } },
      },
      orderBy: { dueDate: 'desc' },
    });
  }

  async findOne(id: string, accountId: string) {
    return prisma.expense.findFirst({
      where: { id, accountId },
      include: {
        property: { select: { name: true } },
        unit: { select: { code: true } },
        leaseContract: { select: { id: true } },
      },
    });
  }

  async create(accountId: string, data: any) {
    return prisma.expense.create({
      data: {
        ...data,
        accountId,
        amount: parseFloat(data.amount),
        dueDate: new Date(data.dueDate),
        paidDate: data.paidDate ? new Date(data.paidDate) : null,
      },
    });
  }

  async update(id: string, accountId: string, data: any) {
    return prisma.expense.update({
      where: { id },
      data: {
        ...data,
        ...(data.amount && { amount: parseFloat(data.amount) }),
        ...(data.dueDate && { dueDate: new Date(data.dueDate) }),
        ...(data.paidDate && { paidDate: new Date(data.paidDate) }),
      },
    });
  }

  async markAsPaid(id: string, accountId: string, paidDate?: string) {
    return prisma.expense.update({
      where: { id },
      data: {
        isPaid: true,
        paidDate: paidDate ? new Date(paidDate) : new Date(),
      },
    });
  }

  async remove(id: string, accountId: string) {
    return prisma.expense.delete({
      where: { id },
    });
  }
}
