import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

@Injectable()
export class LeasingService {

  async findAllContracts(
    accountId: string,
    filters?: { unitId?: string; status?: string },
  ) {
    return prisma.leaseContract.findMany({
      where: {
        accountId,
        ...(filters?.unitId ? { unitId: filters.unitId } : {}),
        ...(filters?.status ? { status: filters.status as any } : {}),
      },
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
        },
        receivables: {
          select: {
            id: true,
            status: true,
            dueDate: true,
            balanceAmount: true,
            paidAmount: true,
          }
        },
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
    const {
      tenantId,
      primaryTenantId,
      startDate,
      endDate,
      rentAmount,
      depositAmount,
      lateFeeValue,
      interestValue,
      ...rest
    } = data;

    // Bloqueia novo contrato ACTIVE em unidade já ocupada
    if (data.status === 'ACTIVE') {
      const ativoExistente = await prisma.leaseContract.findFirst({
        where: { unitId: data.unitId, status: 'ACTIVE', accountId },
      });
      if (ativoExistente) {
        throw new ConflictException(
          'Esta unidade já possui um contrato ativo. Encerre o contrato atual antes de criar um novo.'
        );
      }
    }

    const tenantPrincipal = primaryTenantId ?? tenantId;

    // Strings nos campos Decimal evitam perda de precisão (R$ 1000 → 999.99)
    const contract = await prisma.leaseContract.create({
      data: {
        ...rest,
        accountId,
        primaryTenantId: tenantPrincipal,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        rentAmount: String(rentAmount),
        ...(depositAmount !== undefined && depositAmount !== null
          ? { depositAmount: String(depositAmount) }
          : {}),
        lateFeeType: rest.lateFeeType ?? 'PERCENT',
        lateFeeValue: String(lateFeeValue ?? 2),
        interestType: rest.interestType ?? 'MONTHLY',
        interestValue: String(interestValue ?? 1),
      },
    });

    if (tenantPrincipal) {
      await prisma.leaseTenant.create({
        data: {
          leaseContractId: contract.id,
          tenantId: tenantPrincipal,
          role: 'PRIMARY',
        },
      });
    }

    if (contract.status === 'ACTIVE') {
      await this.gerarReceivables(contract.id);
    }

    return contract;
  }

  async updateContractStatus(id: string, accountId: string, status: any) {
    if (status === 'ACTIVE') {
      const contratoAtual = await prisma.leaseContract.findFirst({
        where: { id, accountId },
      });
      if (!contratoAtual) {
        throw new NotFoundException('Contrato não encontrado');
      }
      const ativoExistente = await prisma.leaseContract.findFirst({
        where: {
          unitId: contratoAtual.unitId,
          status: 'ACTIVE',
          accountId,
          NOT: { id },
        },
      });
      if (ativoExistente) {
        throw new ConflictException(
          'Esta unidade já possui um contrato ativo. Encerre o contrato atual antes de ativar este.'
        );
      }
    }

    const atualizado = await prisma.leaseContract.update({
      where: { id },
      data: { status },
    });

    if (status === 'ACTIVE') {
      await this.gerarReceivables(id);
    }

    return atualizado;
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

  async cancelContract(id: string, accountId: string) {
    return prisma.leaseContract.update({
      where: { id },
      data: { status: 'CANCELLED' as any },
    });
  }

  async adjustRentAmount(id: string, accountId: string, newRentAmount: string) {
    return prisma.leaseContract.update({
      where: { id },
      data: { rentAmount: newRentAmount },
    });
  }

  // Renew/extend a contract with optional field adjustments
  async renewContract(id: string, accountId: string, renewalData: {
    startDate?: string;
    endDate?: string;
    rentAmount?: string;
    dueDay?: number;
    adjustmentIndex?: string;
    lateFeeValue?: string;
    interestValue?: string;
    notes?: string;
  }) {
    const existing = await prisma.leaseContract.findFirst({
      where: { id, accountId },
    });
    if (!existing) {
      throw new NotFoundException('Contrato não encontrado');
    }

    // Calculate new dates
    const newStartDate = renewalData.startDate
      ? new Date(renewalData.startDate)
      : new Date(existing.endDate);
    newStartDate.setDate(newStartDate.getDate() + 1);

    const newEndDate = renewalData.endDate
      ? new Date(renewalData.endDate)
      : new Date(newStartDate);
    newEndDate.setFullYear(newEndDate.getFullYear() + 1);

    // Check unit availability (no active contract)
    const ativoExistente = await prisma.leaseContract.findFirst({
      where: {
        unitId: existing.unitId,
        status: 'ACTIVE',
        accountId,
        NOT: { id },
      },
    });
    if (ativoExistente) {
      throw new ConflictException('Unidade já possui contrato ativo');
    }

    // Create new contract
    const newContract = await prisma.leaseContract.create({
      data: {
        accountId: existing.accountId,
        unitId: existing.unitId,
        primaryTenantId: existing.primaryTenantId,
        startDate: newStartDate,
        endDate: newEndDate,
        rentAmount: renewalData.rentAmount ?? existing.rentAmount.toString(),
        depositAmount: existing.depositAmount,
        adjustmentIndex: (renewalData.adjustmentIndex as any) ?? existing.adjustmentIndex,
        adjustmentFrequencyMonths: existing.adjustmentFrequencyMonths,
        lateFeeType: existing.lateFeeType,
        lateFeeValue: renewalData.lateFeeValue ?? existing.lateFeeValue.toString(),
        interestType: existing.interestType,
        interestValue: renewalData.interestValue ?? existing.interestValue.toString(),
        guaranteeType: existing.guaranteeType,
        status: 'ACTIVE',
        notes: renewalData.notes ?? null,
      },
    });

    // Copy tenants to new contract
    const leaseTenants = await prisma.leaseTenant.findMany({
      where: { leaseContractId: id },
    });
    for (const lt of leaseTenants) {
      await prisma.leaseTenant.create({
        data: {
          leaseContractId: newContract.id,
          tenantId: lt.tenantId,
          role: lt.role,
        },
      });
    }

    // Mark old contract as EXPIRED (not terminated, just expired)
    await prisma.leaseContract.update({
      where: { id },
      data: { status: 'EXPIRED' },
    });

    // Generate receivables for new contract
    await this.gerarReceivables(newContract.id);

    // Schedule renewal reminders for new contract
    const { RenewalsService } = await import('../renewals/renewals.service');
    const renewalsService = new RenewalsService();
    await renewalsService.scheduleReminders(newContract.id);

    return newContract;
  }

  // ============================================================
  // Geração automática de receivables mensais para um contrato
  // ============================================================
  private async gerarReceivables(leaseContractId: string) {
    const lease = await prisma.leaseContract.findUnique({
      where: { id: leaseContractId },
    });

    if (!lease) {
      throw new NotFoundException('Contrato não encontrado');
    }

    // Idempotência
    const existentes = await prisma.receivable.findMany({
      where: { leaseContractId },
      orderBy: { dueDate: 'asc' },
    });
    if (existentes.length > 0) {
      return existentes;
    }

    const rentAmountStr = lease.rentAmount.toString();
    const rentAmountNum = Number(rentAmountStr);
    const dueDay = lease.dueDay;
    const start = new Date(lease.startDate);
    const end = new Date(lease.endDate);

    let cursorAno = start.getUTCFullYear();
    let cursorMes = start.getUTCMonth();
    const diaInicio = start.getUTCDate();

    const novos: Array<ReturnType<typeof this.montarReceivable>> = [];

    if (diaInicio !== 1) {
      if (diaInicio < dueDay) {
        const diasNoMes = this.diasNoMesDe(cursorAno, cursorMes);
        const diasRestantes = diasNoMes - diaInicio + 1;
        const valor = Math.round(rentAmountNum * (diasRestantes / diasNoMes) * 100) / 100;
        const due = this.montarDueDate(cursorAno, cursorMes, dueDay);

        if (due.getTime() <= end.getTime()) {
          novos.push(this.montarReceivable(lease, cursorAno, cursorMes, valor, due));
        }
      }
      ({ ano: cursorAno, mes: cursorMes } = this.avancarMes(cursorAno, cursorMes));
    }

    while (true) {
      const due = this.montarDueDate(cursorAno, cursorMes, dueDay);
      if (due.getTime() > end.getTime()) break;
      novos.push(this.montarReceivable(lease, cursorAno, cursorMes, rentAmountNum, due));
      ({ ano: cursorAno, mes: cursorMes } = this.avancarMes(cursorAno, cursorMes));
    }

    if (novos.length > 0) {
      await prisma.$transaction(
        novos.map((r) => prisma.receivable.create({ data: r })),
      );
    }

    return prisma.receivable.findMany({
      where: { leaseContractId },
      orderBy: { dueDate: 'asc' },
    });
  }

  private diasNoMesDe(ano: number, mes: number): number {
    return new Date(Date.UTC(ano, mes + 1, 0)).getUTCDate();
  }

  private montarDueDate(ano: number, mes: number, dueDay: number): Date {
    const diasNoMes = this.diasNoMesDe(ano, mes);
    const dia = Math.min(dueDay, diasNoMes);
    return new Date(Date.UTC(ano, mes, dia));
  }

  private avancarMes(ano: number, mes: number): { ano: number; mes: number } {
    if (mes === 11) return { ano: ano + 1, mes: 0 };
    return { ano, mes: mes + 1 };
  }

  private montarReceivable(
    lease: { id: string; unitId: string; primaryTenantId: string },
    ano: number,
    mes: number,
    valor: number,
    dueDate: Date,
  ) {
    const valorStr = valor.toFixed(2);
    return {
      leaseContractId: lease.id,
      unitId: lease.unitId,
      tenantId: lease.primaryTenantId,
      competencyMonth: `${ano}-${String(mes + 1).padStart(2, '0')}`,
      dueDate,
      originalAmount: valorStr,
      balanceAmount: valorStr,
      paidAmount: '0',
      status: 'PENDING' as const,
      paidAt: null,
    };
  }
}
