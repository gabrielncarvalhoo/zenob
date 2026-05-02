import { Controller, Get, Post, Delete, Body, Param, Query } from '@nestjs/common';
import { ReconciliationService } from './reconciliation.service';
import { AccountId } from '../../common/auth/auth.decorators';

@Controller('reconciliation')
export class ReconciliationController {
  constructor(private readonly reconciliationService: ReconciliationService) {}

  // Registrar entrada manual (Pix, dinheiro, cheque)
  @Post()
  registerEntry(
    @AccountId() accountId: string,
    @Body() body: {
      tenantId: string;
      leaseContractId: string;
      competencyMonth: string;
      amount: number;
      paymentMethod: 'PIX' | 'CASH' | 'CHECK';
      transactionDate: string;
      notes?: string;
    },
  ) {
    return this.reconciliationService.registerEntry(accountId, body);
  }

  // Listar entradas por competência
  @Get('entries')
  listEntries(
    @AccountId() accountId: string,
    @Query('competencyMonth') competencyMonth?: string,
  ) {
    return this.reconciliationService.listEntries(accountId, competencyMonth);
  }

  // Status de reconciliação por competência
  @Get('status')
  getReconciliationStatus(
    @AccountId() accountId: string,
    @Query('competencyMonth') competencyMonth: string,
  ) {
    return this.reconciliationService.getReconciliationStatus(accountId, competencyMonth);
  }

  // Estornar entrada
  @Delete(':id')
  deleteEntry(@AccountId() accountId: string, @Param('id') id: string) {
    return this.reconciliationService.deleteEntry(id, accountId);
  }
}