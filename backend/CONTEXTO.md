# ZENOB — Contexto do Projeto
> Arquivo de contexto para Claude Code, Antigravity e Cowork
> Atualizado em: Abril 2026

---

## O que é o Zenob

SaaS de **administração de aluguéis** para proprietários particulares e pequenos investidores.
Inspirado no Rentila. **NÃO é marketplace** — foco 100% em backoffice.

**Público-alvo:** Proprietário pessoa física com 1–20 imóveis, que hoje gerencia no Excel.

---

## Desenvolvedor

- **Nome:** Gabriel
- **Background:** Java
- **Ambiente:** Windows 11 + WSL2 (Ubuntu) + Docker Desktop
- **GitHub:** github.com/gabrielncarvalhoo/zenob
- **Planos ativos:** Claude Pro, Gemini Pro, Perplexity Pro

---

## Stack Tecnológico

| Camada | Tecnologia | Versão |
|---|---|---|
| Backend | NestJS + TypeScript | ^10 |
| ORM | Prisma | 5.22.0 |
| Banco local | PostgreSQL (Docker) | 16 |
| Frontend | Next.js + React + TypeScript | (a iniciar) |
| UI | Tailwind CSS + shadcn/ui | (a iniciar) |
| Tabelas | TanStack Table v8 | (a iniciar) |
| Formulários | React Hook Form + Zod | (a iniciar) |
| Filas | Redis + BullMQ | (a iniciar) |
| Auth | Clerk | (a iniciar) |
| Storage | Cloudflare R2 | (a iniciar) |
| E-mail | Resend | (a iniciar) |
| WhatsApp | Meta WhatsApp Business / 360dialog | (a iniciar) |
| PDF | Playwright (HTML → PDF) | (a iniciar) |

---

## Estrutura do Projeto

```
zenob/
└── backend/                          ← NestJS API
    ├── prisma/
    │   ├── schema.prisma             ← 16 tabelas do banco
    │   └── migrations/               ← histórico de mudanças
    ├── src/
    │   ├── main.ts                   ← entrada da API
    │   ├── app.module.ts             ← módulo raiz
    │   └── modules/
    │       └── portfolio/            ← ✅ PRONTO
    │           ├── portfolio.module.ts
    │           ├── portfolio.controller.ts
    │           └── portfolio.service.ts
    ├── tsconfig.json
    ├── prisma.config.ts              ← configuração do Prisma 5
    ├── package.json
    └── .env                          ← NÃO commitar
```

---

## Banco de Dados

**Container Docker:** `zenob-db`
**Conexão:** `postgresql://zenob:zenob123@localhost:5432/zenob_dev`

### Tabelas criadas (16 total)
- `accounts` — contas dos proprietários (multi-tenancy)
- `users` — usuários com acesso à conta
- `properties` — imóveis do portfólio
- `units` — unidades de cada imóvel
- `tenants` — inquilinos e fiadores
- `lease_contracts` — contratos de locação
- `lease_tenants` — relação N:N contrato ↔ inquilino
- `charge_schedules` — regras de recorrência do contrato
- `receivables` — cobranças mensais materializadas
- `payments` — pagamentos de cada cobrança
- `expenses` — despesas do imóvel
- `maintenance_tickets` — chamados de manutenção
- `documents` — PDFs e arquivos gerados
- `notifications` — log de notificações
- `bank_accounts` — contas bancárias
- `bank_transactions` — transações importadas
- `reconciliation_matches` — conciliação bancária

---

## Como Rodar o Projeto

### Subir o banco
```bash
docker start zenob-db
```

### Subir a API
```bash
cd ~/zenob/backend
DATABASE_URL="postgresql://zenob:zenob123@localhost:5432/zenob_dev?schema=public" ./node_modules/.bin/ts-node --transpile-only src/main.ts
```

### Abrir Prisma Studio (visualizar banco)
```bash
cd ~/zenob/backend
DATABASE_URL="postgresql://zenob:zenob123@localhost:5432/zenob_dev?schema=public" ./node_modules/.bin/prisma studio
```

### Rodar migration após mudar o schema
```bash
cd ~/zenob/backend
./node_modules/.bin/prisma generate
./node_modules/.bin/prisma migrate dev --name nome-da-mudanca
```

---

## API — Endpoints Disponíveis

**Base URL:** `http://localhost:3000/api/v1`

### Portfólio (✅ implementado)
```
GET    /properties              → listar imóveis
POST   /properties              → criar imóvel
GET    /properties/:id          → buscar imóvel
PATCH  /properties/:id          → atualizar imóvel
GET    /properties/:id/units    → listar unidades
POST   /properties/:id/units    → criar unidade
```

### Próximos módulos (🔜 a implementar)
```
/tenants       → inquilinos
/leases        → contratos
/receivables   → cobranças
/payments      → pagamentos
/expenses      → despesas
/dashboard     → KPIs
```

---

## Estado Atual do Projeto

### ✅ Concluído
- Arquitetura e stack decididos
- Schema do banco com 16 tabelas
- Migration aplicada — banco criado
- API NestJS rodando na porta 3000
- Módulo Portfolio com 6 rotas funcionando
- Primeiro imóvel cadastrado via API
- Repositório no GitHub: `gabrielncarvalhoo/zenob`

### 🔜 Próximos passos (ordem recomendada)
1. Módulo Tenants (inquilinos)
2. Módulo Leasing (contratos)
3. Módulo Billing (cobranças e recebimentos)
4. Módulo Expenses (despesas)
5. Dashboard com KPIs
6. Iniciar frontend Next.js
7. Autenticação com Clerk
8. Deploy — migrar banco para Supabase

---

## Decisões Arquiteturais Importantes

- **Monólito modular** — não microserviços no MVP
- **Multi-tenancy lógico** — toda entidade tem `accountId`
- **Prisma 5.22** — não atualizar para v6+ ainda (breaking changes)
- **`receivables` separado de `payments`** — suporta pagamento parcial
- **Banco local (Docker)** agora → **Supabase** no deploy
- **Autenticação** hardcoded (`account-teste-001`) durante desenvolvimento — Clerk entra depois

---

## Observações para IA

- Sempre criar novos módulos em `src/modules/nome-do-modulo/`
- Cada módulo tem: `*.module.ts`, `*.controller.ts`, `*.service.ts`
- O PrismaClient deve ser instanciado sem opções: `new PrismaClient()`
- Para rodar comandos Prisma, usar sempre `./node_modules/.bin/prisma`
- Para rodar o servidor, sempre incluir a variável `DATABASE_URL` no comando
- Idioma do projeto e comentários: **português brasileiro**
- Nunca commitar o arquivo `.env`
