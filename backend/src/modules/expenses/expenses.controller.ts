import {
  Controller, Get, Post, Patch, Delete,
  Param, Body, Query,
} from '@nestjs/common';
import { ExpensesService } from './expenses.service';

@Controller('expenses')
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  @Get()
  findAll(
    @Query('propertyId') propertyId?: string,
    @Query('isPaid') isPaid?: string,
    @Query('category') category?: string,
  ) {
    const accountId = 'account-teste-001';
    return this.expensesService.findAll(accountId, {
      propertyId,
      isPaid: isPaid !== undefined ? isPaid === 'true' : undefined,
      category,
    });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    const accountId = 'account-teste-001';
    return this.expensesService.findOne(id, accountId);
  }

  @Post()
  create(@Body() body: any) {
    const accountId = 'account-teste-001';
    return this.expensesService.create(accountId, body);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: any) {
    const accountId = 'account-teste-001';
    return this.expensesService.update(id, accountId, body);
  }

  @Patch(':id/pay')
  markAsPaid(
    @Param('id') id: string,
    @Body('paidDate') paidDate?: string,
  ) {
    const accountId = 'account-teste-001';
    return this.expensesService.markAsPaid(id, accountId, paidDate);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    const accountId = 'account-teste-001';
    return this.expensesService.remove(id, accountId);
  }
}
