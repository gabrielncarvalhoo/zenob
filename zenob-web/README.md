# Zenob Web — Frontend

Frontend do Zenob (SaaS de administração de aluguéis).

## Stack
- Next.js 14 (App Router)
- Tailwind CSS + shadcn/ui
- TanStack Table v8
- React Hook Form + Zod
- Lucide React (ícones)

## Como rodar

```bash
cd zenob-web
npm install
npm run dev
```

O frontend roda em `http://localhost:3000` (ou 3001/3002 se ocupado — Next.js tenta portas automaticamente).

A API backend precisa estar rodando em `http://localhost:3000/api/v1`.

## Telas disponíveis

| Rota | Descrição |
|------|-----------|
| `/dashboard` | KPIs do mês |
| `/imoveis` | Grid de imóveis |
| `/imoveis/novo` | Cadastrar imóvel |
| `/imoveis/[id]` | Detalhe do imóvel |
| `/imoveis/[id]/editar` | Editar imóvel |
| `/inquilinos` | Lista de inquilinos |
| `/inquilinos/novo` | Cadastrar inquilino |
| `/inquilinos/[id]` | Detalhe do inquilino |
| `/contratos` | Lista de contratos |
| `/contratos/novo` | Novo contrato |
| `/contratos/[id]` | Detalhe do contrato |
| `/cobrancas` | Lista de cobranças |
| `/cobrancas/[id]` | Detalhe da cobrança |
| `/despesas` | Lista de despesas |
| `/despesas/novo` | Nova despesa |
| `/despesas/[id]` | Detalhe da despesa |

## Testes E2E

Playwright configurado em `tests/`:

```bash
cd zenob-web
npx playwright test
```

## Estrutura

```
src/
├── app/               # Next.js App Router (pages)
│   ├── dashboard/
│   ├── imoveis/
│   ├── inquilinos/
│   ├── contratos/
│   ├── cobrancas/
│   └── despesas/
├── components/
│   └── layout/        # AppLayout, PageHeader
└── lib/
    └── utils.ts       # cn() utility
```