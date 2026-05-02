import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { TemplatesService } from './templates.service';
import { AccountId } from '../../common/auth/auth.decorators';

@Controller('templates')
export class TemplatesController {
  constructor(private readonly templatesService: TemplatesService) {}

  // Listar templates
  @Get()
  findAll(@AccountId() accountId: string) {
    return this.templatesService.findAll(accountId);
  }

  // Buscar template por ID
  @Get(':id')
  findOne(@AccountId() accountId: string, @Param('id') id: string) {
    return this.templatesService.findOne(id, accountId);
  }

  // Criar template
  @Post()
  create(
    @AccountId() accountId: string,
    @Body() body: { name: string; templateUrl: string; placeholders?: string[] },
  ) {
    return this.templatesService.create(accountId, body);
  }

  // Atualizar template
  @Put(':id')
  update(
    @AccountId() accountId: string,
    @Param('id') id: string,
    @Body() body: { name?: string; templateUrl?: string; isActive?: boolean; placeholders?: string[] },
  ) {
    return this.templatesService.update(id, accountId, body);
  }

  // Deletar template
  @Delete(':id')
  delete(@AccountId() accountId: string, @Param('id') id: string) {
    return this.templatesService.delete(id, accountId);
  }

  // Placeholders suportados
  @Get('supported/placeholders')
  getPlaceholders() {
    return this.templatesService.getSupportedPlaceholders();
  }
}