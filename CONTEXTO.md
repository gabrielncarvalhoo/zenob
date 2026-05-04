# ZENOB — Contexto do Projeto
> Atualizado em: Maio 2026

## O que é o Zenob
SaaS de **administração de aluguéis** para proprietários particulares e pequenos investidores.
Inspirado no Rentila. **NÃO é marketplace** — foco 100% em backoffice.

**Público-alvo:** Proprietário pessoa física com 1–20 imóveis, que hoje gerencia no Excel.

## Desenvolvedor
* **Nome:** Gabriel
* **Background:** Java
* **Ambiente:** Windows 11 + WSL2 (Ubuntu) + Docker Desktop
* **GitHub:** github.com/gabrielncarvalhoo/zenob

## Stack Tecnológico
| Camada | Tecnologia | Versão |
|---|---|---|
| Backend | NestJS + TypeScript | ^10 |
| ORM | Prisma | 5.22.0 |
| Banco local | PostgreSQL (Docker) | 16 |
| Frontend | Next.js + React + TypeScript | 14 |
| UI | Tailwind CSS + shadcn/ui | ativo |
| Tabelas | TanStack Table v8 | ativo |
| Formulários | React Hook Form + Zod | ativo |
| Filas | Redis + BullMQ | futuro |
| Auth | Clerk | futuro |
| Storage | Cloudflare R2 | futuro |
| E-mail | Resend | futuro |
| WhatsApp | Meta WhatsApp Business / 360dialog | futuro |
| PDF | Playwright (HTML → PDF) | futuro |

## Fluxo de trabalho com IA
* **Frontend visual** → Gemini 3.1 Pro no Antigravity
* **Backend, lógica, bugs** → Claude Code (MiniMax para tarefas simples, Sonnet/Opus para complexidade)
* **Decisões, debug difícil** → Claude.ai
* **Design e protótipos** → Claude Design

## Auth
* **@AccountId()** — decorator custom para extrair accountId do header `x-account-id`
* ** accountId hardcoded** — `account-teste-001` até Clerk ser integrado
* Decorator definido em `backend/src/common/auth/auth.decorators.ts`

## Estrutura do Projeto
zenob/
├── backend/          ← NestJS API (porta 3000)
│   ├── prisma/
│   │   └── schema.prisma
│   └── src/
│       └── modules/
│           ├── dashboard/   ✅
│           ├── portfolio/    ✅
│           ├── tenants/     ✅
│           ├── leasing/     ✅
│           ├── billing/     ✅
│           ├── expenses/    ✅
│           ├── notifications/ ✅
│           ├── maintenance/  ✅
│           ├── reconciliation/ ✅
│           ├── templates/    ✅
│           ├── renewals/     ✅
│           └── iptu/         ✅
└── zenob-web/        ← Next.js frontend (porta 3000/3001)
    └── src/
        ├── app/
        │   ├── dashboard/    ✅
        │   ├── imoveis/      ✅ + novo/editar/iptu
        │   ├── inquilinos/   ✅ + novo
        │   ├── contratos/    ✅ + novo/[id]/renovar
        │   ├── cobrancas/    ✅ + [id]
        │   ├── despesas/     ✅ + novo/[id]
        │   └── manutencao/   ✅
        └── components/layout/ ✅

## API — Base URL
`http://localhost:3000/api/v1`

### Endpoints disponíveis

**Dashboard**
GET             /dashboard                          KPIs do mês atual
GET             /dashboard/historical                Histórico 12 meses
GET             /dashboard/occupancy-history         Ocupação mensal
GET             /dashboard/receivables-by-status     Distribuição por status
GET             /dashboard/expenses-by-category     Despesas por categoria

**Portfolio (Properties/Imóveis)**
GET             /properties                         Lista imóveis + unidades
GET             /properties/:id                     Detalhe imóvel + contratos ativos
POST            /properties                         Criar imóvel (auto-cria 1 unidade)
PATCH           /properties/:id                     Atualizar imóvel
GET             /properties/:id/units               Lista unidades
POST            /properties/:id/units               Criar unidade

**Tenants (Inquilinos)**
GET             /tenants                            Lista inquilinos
GET             /tenants/:id                        Detalhe inquilino + contratos
POST            /tenants                            Criar inquilino
PATCH           /tenants/:id                       Atualizar inquilino

**Leasing (Contratos)**
GET             /leases                             Lista contratos (filtros: unitId, status)
GET             /leases/:id                         Detalhe contrato completo
POST            /leases                             Criar contrato
PATCH           /leases/:id/status                  Atualizar status (ativa/desativa)
POST           /leases/:id/terminate                Encerrar contrato (TERMINATED)
POST           /leases/:id/cancel                   Cancelar contrato (CANCELLED)
PATCH          /leases/:id/rent-amount              Ajustar valor do aluguel
POST           /leases/:id/renew                    Renovar contrato (encerra + cria novo)
GET            /leases/:id/contract/pdf            Gerar PDF do contrato

**Billing (Cobranças/Pagamentos)**
GET             /receivables                        Lista cobranças (filtros: leaseId, tenantId, limit)
GET             /receivables/:id                    Detalhe cobrança
POST            /receivables/:id/payments           Registrar pagamento (distribui automaticamente)
PATCH           /receivables/:id/status             Atualizar status
POST            /receivables/:id/waive              Marcar como isento (WAIVED)
POST            /receivables/ensure-next/:leaseId   Garantir próximo receivable em aberto
GET             /receivables/:id/receipt/pdf       Download PDF do recibo

**Expenses (Despesas)**
GET             /expenses                           Lista despesas (filtros: propertyId, isPaid, category)
GET             /expenses/:id                       Detalhe despesa
POST            /expenses                           Criar despesa
PATCH           /expenses/:id                       Atualizar despesa
PATCH           /expenses/:id/pay                   Marcar como paga
DELETE          /expenses/:id                       Excluir despesa

**Notifications**
GET             /notifications                      Lista notificações
PATCH           /notifications/:id/read             Marcar como lida

**IPTU**
GET             /iptu/properties                    Lista status IPTU de todos imóveis
GET             /iptu/dashboard                     Resumo para dashboard
POST            /iptu/batch-check                   Verificar todos no site da Prefeitura
POST            /iptu/verify/:propertyId            Verificar imóvel específico (aceita { force: true })
POST            /iptu/confirm/:propertyId           Confirmar pagamento manualmente
POST            /iptu/pending/:propertyId           Marcar como pendente manualmente
POST            /iptu/auto/:propertyId             Marcar como automático (AUTO)
POST            /iptu/boleto                       Download de boleto PDF (body: { iptuCode, parcelas })

**Renewals**
GET             /renewals/upcoming                  Renovações próximas (próximos 60 dias)

**Templates**
GET             /templates                           Lista templates
GET             /templates/:id                       Detalhe template
POST            /templates                           Criar template
PATCH           /templates/:id                       Atualizar template

## Módulos backend — detalhes

### leasing
* `findAllContracts` inclui `unit → property`, `leaseTenants → tenant`, `receivables`
* `createContract` valida duplicidade de contrato ativo na mesma unidade
* Geração automática de receivables ao criar/ativar contrato
* Status: DRAFT | ACTIVE | EXPIRED | TERMINATED | CANCELLED
* **Ajuste de aluguel** (`PATCH /leases/:id/rent-amount`) — atualiza `rentAmount` sem afectar cobranças existentes
* **Cancelar contrato** (`POST /leases/:id/cancel`) — marca como CANCELLED
* **Renovar contrato** (`POST /leases/:id/renew`) — encerra atual + cria novo

### billing
* `registerPayment` distribui pagamento automaticamente: primeiro overdue, depois current, depois future
* Cria próximo receivable automaticamente se contrato ACTIVE e não existir
* `aplicarOverdue()` — converte PENDING para OVERDUE dinamicamente (sem persistir)
* Status: PENDING | PAID | PARTIAL | OVERDUE | RENEGOTIATED | WAIVED

### expenses
* Filtros via query: `?isPaid=true/false`, `?propertyId=`, `?category=`
* Categorias: MAINTENANCE/CONDOMINIUM/IPTU/INSURANCE/ADMIN/WATER/ENERGY/OTHER
* Campo `isRecoverable` para marcar despesas reembolsáveis pelo inquilino

### dashboard
* KPIs: a receber, recebido, inadimplência (R$), ocupação (%), despesas do mês, contratos ativos
* Histórico de 12 meses (recebido, despesas, atrasado)
* Evolução de ocupação mensal

### iptu
* Scraping do site da Prefeitura de Campina Grande (https://campinagrande.pb.gov.br/iptu/)
* Scraping via POST para digitamatricula.php com parâmetro `matricula`
* **Endpoint de verificação com force** — `POST /iptu/verify/:id` com `{ force: true }` ignora status MANUAL
* **Detalhes de parcelas** — scraping do `<tbody>` extrai: parcela, vencimento, receita, total, status (VENCIDO/A_VENCER)
* **Download de boleto** — `POST /iptu/boleto` com `{ iptuCode, parcelas }` retorna PDF real
* Status: PAID | PENDING | NOT_FOUND | UNKNOWN
* Status source: MANUAL (confirmado manualmente) ou AUTO (verificado automaticamente)
* Agenda: Jan-Jun a cada 10 dias, Jul-Dec mensal, Jan 10 reset
* Confirmação manual de pagamento
* Campos em Property: iptuStatus, iptuStatusSource, iptuLastChecked

### renewals
* Agenda lembretes de renovação (30, 20, 10, 5, 2, 1 dia antes e 10 depois)
* Alertas no dashboard para contratos vencendo em até 60 dias

### templates
* Modelos de contrato com templateUrl (link para template customizado)
* Suporte a templates personalizados na geração de PDF

### reconciliation
* Conciliação de pagamentos — vincula pagamentos automáticos a cobranças
* Identifica diferenças de valor, antecipa crédito, detecta pagamentos não-identificados

## Frontend — Telas existentes

| Rota | Descrição |
|------|-----------|
| `/dashboard` | KPIs do mês (cards: a receber, recebido, inadimplência, ocupação, despesas, contratos) + gráficos + alertas de renovação |
| `/imoveis` | Grid de imóveis com ícones por tipo e badges de vacância |
| `/imoveis/iptu` | Status IPTU de todos imóveis + verificar todos + confirmar manualmente |
| `/imoveis/novo` | Formulário com CEP automático, multi-unidade para COMPLEX |
| `/imoveis/[id]` | Detalhe do imóvel com tabela de unidades e leases ativos |
| `/imoveis/[id]/editar` | Editar imóvel |
| `/inquilinos` | Lista de inquilinos com badges (em dia/em dívida/inativo) e total devido |
| `/inquilinos/novo` | Formulário com máscara CPF, telefone, moeda |
| `/inquilinos/[id]` | Detalhe com contratos e imóveis alugados |
| `/contratos` | Lista de contratos com filtros (status) e busca |
| `/contratos/novo` | Formulário com selects em cascata (imóvel → unidades → inquilino) |
| `/contratos/[id]` | Detalhe: imóvel, inquilino, condições, garantías, ações |
| `/contratos/[id]/renovar` | Renovar contrato com nova vigência e valor |
| `/cobrancas` | Lista de cobranças com abas (todas/pendentes/atrasadas/pagas/parcial) |
| `/cobrancas/[id]` | Detalhe da cobrança com modal de pagamento |
| `/despesas` | Lista de despesas com abas (todas/a pagar/pagas) |
| `/despesas/novo` | Formulário com categoria, valor, data, propriedade |
| `/despesas/[id]` | Detalhe da despesa |
| `/manutencao` | Solicitações de manutenção |

## Funcionalidades implementadas

### Contratos
- Listagem com status calculado (Atrasado/Em dia/Pendente/Adiantado) para contratos ACTIVE
- StatusLease: DRAFT → ACTIVE → TERMINATED/CANCELLED
- Encerrar contrato com data e motivo
- Cancelar/excluir contrato com confirmação modal
- Ajustar valor do aluguel a qualquer momento (modal)
- Renovar contrato (encerra atual + cria novo com nova vigência)
- Alerta de reajuste quando faltam ≤30 dias
- **secondaryTenantIds** — array deFiadores secundários (múltiplos permitidos)
- Botão dinâmico "Adicionar fiador" no formulário de contrato

### Cobranças
- Lista com lógica inteligente: atrasados → mês atual; pago → próximo em aberto
- Pagamento parcial suportado
- Crédito para mês seguinte quando pagamento excede valor
- Isentar cobrança (WAIVED)
- Registro de pagamento com distribuição automática

### Imóveis
- CRUD completo
- Unidade auto-criada ao cadastrar imóvel (exceto tipo COMPLEX)
- Campos obrigatórios: IPTU, água, energia (obrigatórios — link https://campinagrande.pb.gov.br/iptu/)
- CEP automático (ViaCEP)
- Status IPTU por imóvel com verificação automática

### IPTU
- Verificação automática via scraping do site da Prefeitura
- Status: Pago, Pendente, Não encontrado, Desconhecido
- Badge (A) para AUTO, (M) para MANUAL
- Reset anual em 10 de Janeiro
- Agenda: Jan-Jun a cada 10 dias, Jul-Dec mensal
- Confirmação manual de pagamento
- **Accordion expandido** com lista de parcelas individuais (número, vencimento, descrição, valor, status)
- **Checkbox para selecionar parcelas** e baixar boleto(s) em PDF
- Botão na página do imóvel para abrir site da Prefeitura

### Inquilinos
- CRUD completo
- Campos: fullName, CPF, RG, birthDate, email, phone, employer, monthlyIncome

## Backlog

### Alto valor (próximos)
- Autenticação com Clerk (conta multi-usuário, login real)
- Geração de PDF (recibo de pagamento, contrato)
- Upload de modelo de contrato personalizado
- Filtros e busca na listagem de imóveis
- Notificações via e-mail/WhatsApp
- Upload de contratos e documentos

### Médio valor
- Editar/confirmar pagamento em `/cobrancas/[id]`
- Renovação automática de contrato (em vez de manual)
- Relatório de inadimplência
- Importação de transações bancárias

### Baixo valor / futuro
- Sistema de pastas para agrupar imóveis
- Planos (FREE/STARTER/PRO) com limites de imóveis
- Backup automático do banco
- Deploy para produção (Supabase como DB)

## Decisões Arquiteturais
* **Monólito modular** — não microserviços no MVP
* **Multi-tenancy lógico** — toda entidade tem `accountId`
* **Prisma 5.22** — nunca atualizar para v6+
* **`receivables` separado de `payments`** — suporta pagamento parcial
* **Auth hardcoded** (`account-teste-001`) — Clerk entra depois
* **Um imóvel pode ter múltiplos inquilinos** via `lease_tenants` (N:N)
* **Um inquilino pode ter múltiplos imóveis** via `lease_tenants` (N:N)
* **Data handling UTC puro** — evita bugs de DST
* **IPTU scraping** — simples verificação de mensagem, nãovalidação de números