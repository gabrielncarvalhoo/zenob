# ZENOB — Contexto do Projeto
> Atualizado em: Abril 2026

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
| Tabelas | TanStack Table v8 | a integrar |
| Formulários | React Hook Form + Zod | a integrar |
| Filas | Redis + BullMQ | futuro |
| Auth | Clerk | futuro |
| Storage | Cloudflare R2 | futuro |
| E-mail | Resend | futuro |
| WhatsApp | Meta WhatsApp Business / 360dialog | futuro |
| PDF | Playwright (HTML → PDF) | futuro |

## Fluxo de trabalho com IA
* **Frontend** → Gemini 2.5 Pro no Antigravity
* **Backend** → Claude Code no Antigravity
* **Decisões, debug, dúvidas** → Claude.ai (aqui)
* **Design e protótipos** → Claude Design
* **Documentação** → Claude Cowork

## Estrutura do Projeto
zenob/
├── CLAUDE.md
├── CONTEXTO.md
├── backend/          ← NestJS API
│   ├── prisma/
│   │   └── schema.prisma
│   └── src/
│       └── modules/
│           ├── portfolio/    ✅
│           ├── tenants/     ✅
│           ├── leasing/     ✅
│           ├── billing/     ✅
│           ├── expenses/    ✅
│           └── dashboard/   ✅
└── zenob-web/        ← Next.js frontend
    └── src/
        ├── app/
        │   ├── dashboard/    ✅
        │   ├── imoveis/      ✅
        │   └── inquilinos/   ✅
        └── components/
            └── layout/       ✅

## Banco de Dados
**Container Docker:** `zenob-db`
**Conexão:** `postgresql://zenob:zenob123@localhost:5432/zenob_dev`

## API — Base URL
`http://localhost:3000/api/v1`

### Endpoints disponíveis
GET/POST        /properties
GET/PATCH       /properties/:id
GET/POST        /properties/:id/units
GET/POST/PATCH  /tenants, /tenants/:id
GET/POST/PATCH  /leases, /leases/:id
PATCH           /leases/:id/status  → muda status; dispara geração de receivables se ACTIVE
GET             /receivables, /receivables/:id
POST            /receivables/:id/payments
PATCH           /receivables/:id/status
POST            /receivables/:id/waive
GET/POST/PATCH  /expenses, /expenses/:id
PATCH           /expenses/:id/pay
DELETE          /expenses/:id
GET             /dashboard

## Módulos backend — detalhes

### leasing
* `findAllContracts` e `findOneContract` fazem `include` de `unit → property` e `leaseTenants → tenant`
* `createContract` insere valores padrão: `lateFeeType: PERCENT`, `lateFeeValue: 2`, `interestType: MONTHLY`, `interestValue: 1`
* Após criar contrato, cria automaticamente `leaseTenant` com `role: PRIMARY`
* Enums: `LeaseStatus` (DRAFT/ACTIVE/EXPIRED/TERMINATED), `AdjustmentIndex` (IGP_M/IPCA/INPC/FIXED), `GuaranteeType` (DEPOSIT/SURETY/INSURANCE/NONE)
* **Geração automática de receivables:**
  - Disparada ao criar contrato com `status: ACTIVE` ou ao fazer PATCH status DRAFT → ACTIVE
  - Primeiro mês proporcional: se `startDate < dueDay`, gera receivable proporcional (`rentAmount * diasRestantes / diasNoMes`); se `startDate >= dueDay`, pula para o mês seguinte cheio
  - `dueDay` > dias do mês → usa último dia do mês (ex: dia 31 em fevereiro → 28)
  - Idempotência: se já existem receivables para o `leaseId`, retorna os existentes silenciosamente
  - Atomicidade via `prisma.$transaction`
  - Toda lógica de datas em UTC puro para evitar bugs de DST

### billing
* `registerPayment` usa `prisma.$transaction` para atomicidade
* Suporta pagamento parcial: atualiza `paidAmount`, `balanceAmount`, `status`
* Status: PENDING/PAID/PARTIAL/OVERDUE/RENEGOTIATED/WAIVED
* Se `novoSaldo <= 0` → status PAID + seta `paidAt`
* Se `novoSaldo > 0` → status PARTIAL
* Retorna `{ payment, resumo: { valorPago, totalPago, saldoRestante, credito, status } }`

### expenses
* Filtros via query params: `?isPaid=true/false`, `?propertyId=`, `?category=`
* Categorias: MAINTENANCE/CONDOMINIUM/IPTU/INSURANCE/ADMIN/WATER/ENERGY/OTHER
* Rota especial: `PATCH /expenses/:id/pay`

### dashboard
* Retorna: `{ competencyMonth, aReceber, recebido, inadimplencia, ocupacao, despesas, contratosAtivos }`

## Funcionalidades planejadas (backlog)

### Cadastro de imóvel
* Inscrição imobiliária do IPTU (obrigatório) — link para https://campinagrande.pb.gov.br/iptu/
* Matrícula de água — Cagepa (obrigatório)
* Matrícula de energia — Energisa (obrigatório)
* Número da escritura (opcional)
* Geração de contrato de aluguel em PDF pelo sistema
* Upload de modelo de contrato personalizado pelo usuário

### Cobranças e pagamentos
* Ajuste de valor no registro de pagamento (pagamento parcial ou a mais)
* Recibo personalizado gerado em PDF para cada pagamento

### Filtros e busca
* Busca de imóvel por nome/endereço
* Filtros na listagem: Ocupados, Não ocupados, Pagos, Em atraso, IPTU pago, IPTU não pago

### Lembretes automáticos (via BullMQ + Redis)
* Lembrete de vencimento de pagamento
* Alerta de atraso
* Alerta de ajuste de aluguel (anual ou conforme configuração do contrato)

### Pendentes
* Sistema de pastas para agrupar imóveis
* Geração de PDF (recibo de pagamento e contrato)
* Filtros e busca de imóveis na listagem
* Formulários de edição (imóvel, inquilino, contrato)
* Tela de detalhe do contrato listando receivables gerados
* Testes E2E para contratos, cobranças e despesas

## Decisões Arquiteturais
* **Monólito modular** — não microserviços no MVP
* **Multi-tenancy lógico** — toda entidade tem `accountId`
* **Prisma 5.22** — não atualizar para v6+
* **`receivables` separado de `payments`** — suporta pagamento parcial
* **Auth hardcoded** (`account-teste-001`) durante dev — Clerk entra depois
* **Um imóvel pode ter múltiplos inquilinos** via `lease_tenants` (N:N)
* **Um inquilino pode ter múltiplos imóveis** via `lease_tenants` (N:N)
