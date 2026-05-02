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
│           └── expenses/    ✅
└── zenob-web/        ← Next.js frontend (porta 3000/3001)
    └── src/
        ├── app/
        │   ├── dashboard/    ✅
        │   ├── imoveis/      ✅ + novo/editar
        │   ├── inquilinos/   ✅ + novo
        │   ├── contratos/    ✅ + novo/[id]
        │   ├── cobrancas/    ✅ + [id]
        │   └── despesas/     ✅ + novo/[id]
        └── components/layout/ ✅

## API — Base URL
`http://localhost:3000/api/v1`

### Endpoints disponíveis

**Dashboard**
GET             /dashboard                          KPIs do mês atual

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

**Billing (Cobranças/Pagamentos)**
GET             /receivables                        Lista cobranças (filtros: leaseId, tenantId, limit)
GET             /receivables/:id                    Detalhe cobrança
POST            /receivables/:id/payments            Registrar pagamento (distribui automaticamente)
PATCH           /receivables/:id/status             Atualizar status
POST            /receivables/:id/waive              Marcar como isento (WAIVED)

**Expenses (Despesas)**
GET             /expenses                           Lista despesas (filtros: propertyId, isPaid, category)
GET             /expenses/:id                       Detalhe despesa
POST            /expenses                           Criar despesa
PATCH           /expenses/:id                       Atualizar despesa
PATCH           /expenses/:id/pay                   Marcar como paga
DELETE          /expenses/:id                       Excluir despesa

## Módulos backend — detalhes

### leasing
* `findAllContracts` inclui `unit → property`, `leaseTenants → tenant`, `receivables`
* `createContract` valida duplicidade de contrato ativo na mesma unidade
* Geração automática de receivables ao criar/ativar contrato
* Status: DRAFT | ACTIVE | EXPIRED | TERMINATED | CANCELLED
* **Ajuste de aluguel** (`PATCH /leases/:id/rent-amount`) — atualiza `rentAmount` sem afectar cobranças existentes
* **Cancelar contrato** (`POST /leases/:id/cancel`) — marca como CANCELLED

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

## Frontend — Telas existentes

| Rota | Descrição |
|------|-----------|
| `/dashboard` | KPIs do mês (cards: a receber, recebido, inadimplência, ocupação, despesas, contratos) |
| `/imoveis` | Grid de imóveis com ícones por tipo e badges de vacância |
| `/imoveis/novo` | Formulário com CEP automático, multi-unidade para COMPLEX |
| `/imoveis/[id]` | Detalhe do imóvel com tabela de unidades e leases ativos |
| `/imoveis/[id]/editar` | Editar imóvel |
| `/inquilinos` | Lista de inquilinos com badges (em dia/em dívida/inativo) e total devido |
| `/inquilinos/novo` | Formulário com máscara CPF, telefone, moeda |
| `/inquilinos/[id]` | Detalhe com contratos e imóveis alugados |
| `/contratos` | Lista de contratos com filtros (status) e busca |
| `/contratos/novo` | Formulário com selects em cascata (imóvel → unidades → inquilino) |
| `/contratos/[id]` | Detalhe: imóvel, inquilino, condições, garantías, ações |
| `/cobrancas` | Lista de cobranças com abas (todas/pendentes/atrasadas/pagas/parcial) |
| `/cobrancas/[id]` | Detalhe da cobrança com modal de pagamento |
| `/despesas` | Lista de despesas com abas (todas/a pagar/pagas) |
| `/despesas/novo` | Formulário com categoria, valor, data, propriedade |
| `/despesas/[id]` | Detalhe da despesa |

## Funcionalidades implementadas

### Contratos
- Listagem com status calculado (Atrasado/Em dia/Pendente/Adiantado) para contratos ACTIVE
- StatusLease: DRAFT → ACTIVE → TERMINATED/CANCELLED
- Encerrar contrato com data e motivo
- Cancelar/excluir contrato com confirmação modal
- Ajustar valor do aluguel a qualquer momento (modal)
- Renovar contrato (encerra atual + cria novo com nova vigência)
- Alerta de reajuste quando faltam ≤30 dias

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

### Inquilinos
- CRUD completo
- Campos: fullName, CPF, RG, birthDate, email, phone, employer, monthlyIncome

## Pendente no backlog

### Alto valor (próximos)
- Autenticação com Clerk (conta multi-usuário, login real)
- Geração de PDF (recibo de pagamento, contrato)
- Upload de modelo de contrato personalizado
- Filtros e busca na listagem de imóveis
- Tela de manutenção (tickets)
- Notificações via e-mail/WhatsApp

### Médio valor
- Sistema de pastas para agrupar imóveis
- Editar/confirmar pagamento em `/cobrancas/[id]`
- Renovação automática de contrato (em vez de manual)
- Dashboard com gráficos históricos
- Relatório de inadimplência

### Baixo valor / futuro
- Importação de transações bancárias e conciliação automática
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