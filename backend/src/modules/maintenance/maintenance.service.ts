import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

@Injectable()
export class MaintenanceService {
  async findAll(accountId: string, filters?: {
    propertyId?: string;
    status?: string;
    priority?: string;
  }) {
    return prisma.maintenanceTicket.findMany({
      where: {
        property: { accountId },
        ...(filters?.propertyId ? { propertyId: filters.propertyId } : {}),
        ...(filters?.status ? { status: filters.status as any } : {}),
        ...(filters?.priority ? { priority: filters.priority as any } : {}),
      },
      include: {
        property: { select: { id: true, name: true, address: true } },
        unit: { select: { id: true, code: true } },
        tenant: { select: { id: true, fullName: true } },
        tenant: { select: { id: true, fullName: true, phone: true } },
      },
      orderBy: { openedAt: 'desc' },
    });
  }

  async findOne(id: string, accountId: string) {
    const ticket = await prisma.maintenanceTicket.findFirst({
      where: { id, property: { accountId } },
      include: {
        property: { select: { id: true, name: true, address: true, accountId: true } },
        unit: { select: { id: true, code: true } },
        tenant: { select: { id: true, fullName: true } },
        tenant: { select: { id: true, fullName: true, email: true, phone: true } },
      },
    });
    return ticket;
  }

  async create(accountId: string, data: {
    propertyId: string;
    unitId?: string;
    tenantId?: string;
    title: string;
    description?: string;
    priority?: string;
    estimatedCost?: number;
    supplierName?: string;
    notes?: string;
  }) {
    // Valida property pertence à account
    const property = await prisma.property.findFirst({
      where: { id: data.propertyId, accountId },
    });
    if (!property) {
      throw new NotFoundException('Imóvel não encontrado');
    }

    return prisma.maintenanceTicket.create({
      data: {
        propertyId: data.propertyId,
        unitId: data.unitId ?? null,
        tenantId: data.tenantId ?? null,
        title: data.title,
        description: data.description ?? null,
        priority: (data.priority as any) ?? 'MEDIUM',
        estimatedCost: data.estimatedCost ? String(data.estimatedCost) : null,
        supplierName: data.supplierName ?? null,
        notes: data.notes ?? null,
      },
      include: {
        property: { select: { id: true, name: true, address: true } },
        unit: { select: { id: true, code: true } },
        tenant: { select: { id: true, fullName: true } },
        tenant: { select: { id: true, fullName: true } },
      },
    });
  }

  async update(id: string, accountId: string, data: {
    title?: string;
    description?: string;
    priority?: string;
    status?: string;
    estimatedCost?: number;
    actualCost?: number;
    supplierName?: string;
    notes?: string;
    closedAt?: string;
  }) {
    // Verifica ownership
    const existing = await prisma.maintenanceTicket.findFirst({
      where: { id, property: { accountId } },
    });
    if (!existing) {
      throw new NotFoundException('Ticket não encontrado');
    }

    return prisma.maintenanceTicket.update({
      where: { id },
      data: {
        ...(data.title !== undefined ? { title: data.title } : {}),
        ...(data.description !== undefined ? { description: data.description } : {}),
        ...(data.priority !== undefined ? { priority: data.priority as any } : {}),
        ...(data.status !== undefined ? { status: data.status as any } : {}),
        ...(data.estimatedCost !== undefined ? { estimatedCost: data.estimatedCost ? String(data.estimatedCost) : null } : {}),
        ...(data.actualCost !== undefined ? { actualCost: data.actualCost ? String(data.actualCost) : null } : {}),
        ...(data.supplierName !== undefined ? { supplierName: data.supplierName } : {}),
        ...(data.notes !== undefined ? { notes: data.notes } : {}),
        ...(data.closedAt !== undefined ? { closedAt: data.closedAt ? new Date(data.closedAt) : null } : {}),
      },
      include: {
        property: { select: { id: true, name: true, address: true } },
        unit: { select: { id: true, code: true } },
        tenant: { select: { id: true, fullName: true } },
        tenant: { select: { id: true, fullName: true } },
      },
    });
  }

  async updateStatus(id: string, accountId: string, status: string) {
    const existing = await prisma.maintenanceTicket.findFirst({
      where: { id, property: { accountId } },
    });
    if (!existing) {
      throw new NotFoundException('Ticket não encontrado');
    }

    const updateData: any = { status: status as any };
    if (status === 'RESOLVED' || status === 'CLOSED') {
      updateData.closedAt = new Date();
    }

    return prisma.maintenanceTicket.update({
      where: { id },
      data: updateData,
    });
  }

  async delete(id: string, accountId: string) {
    const existing = await prisma.maintenanceTicket.findFirst({
      where: { id, property: { accountId } },
    });
    if (!existing) {
      throw new NotFoundException('Ticket não encontrado');
    }

    await prisma.maintenanceTicket.delete({ where: { id } });
    return { deleted: true };
  }

  // KPIs de manutenção para dashboard
  async getStats(accountId: string) {
    const [open, inProgress, waiting, resolved, closed] = await Promise.all([
      prisma.maintenanceTicket.count({
        where: { property: { accountId }, status: 'OPEN' },
      }),
      prisma.maintenanceTicket.count({
        where: { property: { accountId }, status: 'IN_PROGRESS' },
      }),
      prisma.maintenanceTicket.count({
        where: { property: { accountId }, status: 'WAITING' },
      }),
      prisma.maintenanceTicket.count({
        where: { property: { accountId }, status: 'RESOLVED' },
      }),
      prisma.maintenanceTicket.count({
        where: { property: { accountId }, status: 'CLOSED' },
      }),
    ]);

    const total = open + inProgress + waiting + resolved + closed;

    const costResult = await prisma.maintenanceTicket.aggregate({
      where: { property: { accountId }, actualCost: { not: null } },
      _sum: { actualCost: true },
    });

    return {
      total,
      open,
      inProgress,
      waiting,
      resolved,
      closed,
      totalSpent: Number(costResult._sum.actualCost?.toString() ?? 0),
    };
  }
}