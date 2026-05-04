# AGENTS.md — Zenob

## Repo Structure
```
zenob/
├── backend/       NestJS + Prisma 5.22 + PostgreSQL 16
└── zenob-web/     Next.js 14 (App Router) + Tailwind + shadcn/ui
```

## How to Run
```bash
# 1. Start database
docker start zenob-db

# 2. Start backend (ts-node with reflect-metadata)
cd ~/zenob/backend
DATABASE_URL="postgresql://zenob:zenob123@localhost:5432/zenob_dev?schema=public" \
  ./node_modules/.bin/ts-node --transpile-only src/main.ts

# 3. Start frontend (separate terminal)
cd ~/zenob/zenob-web && npm run dev
```

Or use `./start.sh` from root to run all at once (backend in background).

## Critical Constraints
- **Prisma: NEVER upgrade past 5.22.0** — blocked for compatibility
- **accountId: hardcoded as `'account-teste-001'`** until Clerk auth is integrated
- **PrismaClient: always `new PrismaClient()`** — no options, no singleton pattern
- **tsconfig ts-node section**: `esm: false`, `transpileOnly: true` — don't change
- **Backend requires `reflect-metadata`** — imported in main.ts, don't remove

## Backend Architecture
- Modules live in `src/modules/<name>/` with `*.module.ts`, `*.controller.ts`, `*.service.ts`
- API base: `http://localhost:3000/api/v1`
- All routes include `accountId` filter (currently hardcoded)
- Date handling: UTC pure to avoid DST bugs
- Receivable generation is idempotent and atomic via `prisma.$transaction`
- Payment registration uses `$transaction` for atomicity; supports partial payments

## Frontend Architecture
- **App Router** (`src/app/`) — pages: `dashboard/`, `imoveis/`, `inquilinos/`, `contratos/`, `cobrancas/`, `despesas/`, `manutencao/`
- Components in `src/components/`
- Icons: Lucide React | Tables: TanStack Table v8 | Forms: React Hook Form + Zod
- UI language: Portuguese (Brazil)
- IPTU page (`imoveis/iptu/`): accordion expandido com parcelas individuais, checkbox seleção, botão download boleto PDF

## Design Tokens
```
Primary: #3B6D11 | Primary dark: #27500A | Primary light bg: #EAF3DE
Warning: #BA7517 / bg: #FAEEDA | Error: #E24B4A / bg: #FCEBEB
```

## Key DB Field Names (non-obvious)
- `Tenant.fullName` (not `name`)
- `Tenant.employer` (not `occupation`)
- `Tenant.monthlyIncome` is Decimal
- `Property.iptuCode`, `waterRegistration`, `energyRegistration` are required at signup
- `LeaseContract.secondaryTenantIds` is string array (JSON) for multiple secondary tenants
- IPTU lookup: https://campinagrande.pb.gov.br/iptu/
- `Receivable.status`: PENDING | PAID | PARTIAL | OVERDUE | RENEGOTIATED | WAIVED
- IPTU site: POST to `https://ecidadeonline.campinagrande.pb.gov.br/digitamatricula.php` with `matricula` parameter
- IPTU boleto: POST to `https://ecidadeonline.campinagrande.pb.gov.br/xk7m9p2_iptu_boleto.php` with `matricula` and `parcelas[]`

## Prisma
- Migrate: `npx prisma migrate dev --name <name>`
- Generate client: `npx prisma generate`
- After schema changes, regenerate before running backend

## Important Enums
`LeaseStatus`: DRAFT | ACTIVE | EXPIRED | TERMINATED | CANCELLED
`ReceivableStatus`: PENDING | PAID | PARTIAL | OVERDUE | RENEGOTIATED | WAIVED
`ExpenseCategory`: MAINTENANCE | CONDOMINIUM | IPTU | INSURANCE | ADMIN | WATER | ENERGY | OTHER
`AdjustmentIndex`: IGP_M | IPCA | INPC | FIXED
`GuaranteeType`: DEPOSIT | SURETY | INSURANCE | NONE
`LateFeeType`: PERCENT | FIXED
`InterestType`: DAILY | MONTHLY

## Frontend Scripts
```bash
npm run dev     # development
npm run build   # production build
npm run start   # production server
npm run lint    # ESLint
```
No `test` or `typecheck` scripts configured in zenob-web.

## Testes E2E
Playwright configurado em `zenob-web/tests/`.
Rodar: `cd zenob-web && npx playwright test`

## No CI/CD configurado
Verificar manualmente antes de merger.
