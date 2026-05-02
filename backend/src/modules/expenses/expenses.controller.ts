import {
  Controller, Get, Post, Patch, Delete,
  Param, Body, Query,
} from '@nestjs/common';
import { ExpensesService } from './expenses.service';
import { AccountId } from '../../common/auth/auth.decorators';

@Controller('expenses')
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  @Get()
  findAll(
    @Query('propertyId') propertyId?: string,
    @Query('isPaid') isPaid?: string,
    @Query('category') category?: string,
    @AccountId() accountId?: string,
  ) {
    return this.expensesService.findAll(accountId, {
      propertyId,
      isPaid: isPaid !== undefined ? isPaid === 'true' : undefined,
      category,
    });
  }

  @Get(':id')
  findOne(@Param('id') id: string, @AccountId() accountId: string) {
    return this.expensesService.findOne(id, accountId);
  }

  @Post()
  create(@Body() body: any, @AccountId() accountId: string) {
    return this.expensesService.create(accountId, body);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: any, @AccountId() accountId: string) {
    return this.expensesService.update(id, accountId, body);
  }

  @Patch(':id/pay')
  markAsPaid(
    @Param('id') id: string,
    @Body('paidDate') paidDate?: string,
    @AccountId() accountId?: string,
  ) {
    return this.expensesService.markAsPaid(id, accountId, paidDate);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @AccountId() accountId: string) {
    return this.expensesService.remove(id, accountId);
  }
}
