# Zenob — Instruções para Claude Code

## O que é o Zenob
SaaS de administração de aluguéis para proprietários particulares. NÃO é marketplace — foco 100% em backoffice. Leia o CONTEXTO.md para detalhes completos.

## Estrutura do projeto
zenob/
├── backend/     → NestJS + Prisma 5.22 + PostgreSQL 16
└── zenob-web/   → Next.js 14 + Tailwind + shadcn/ui

## Como rodar o backend
```bash
docker start zenob-db
cd ~/zenob/backend
DATABASE_URL="postgresql://zenob:zenob123@localhost:5432/zenob_dev?schema=public" ./node_modules/.bin/ts-node --transpile-only src/main.ts
```

## Como rodar o frontend
```bash
cd ~/zenob/zenob-web
npm run dev
```

## API
Base URL: http://localhost:3000/api/v1
Rotas: /properties, /tenants, /leases, /receivables, /expenses, /dashboard

## Regras importantes
- Nunca atualizar Prisma além da versão 5.22.0
- accountId hardcoded como 'account-teste-001' até Clerk ser integrado
- Idioma do código e comentários: português brasileiro
- Novos módulos backend em src/modules/nome-do-modulo/
- Cada módulo tem: *.module.ts, *.controller.ts, *.service.ts
- PrismaClient instanciado sem opções: new PrismaClient()

## Cores principais (design system)
- Primary: #3B6D11
- Primary dark: #27500A
- Primary light bg: #EAF3DE
- Warning: #BA7517
- Error: #E24B4A

## Stack frontend
- Next.js 14 com App Router
- TypeScript
- Tailwind CSS
- shadcn/ui (Base + Nova preset)
- TanStack Table v8 (para tabelas)
- React Hook Form + Zod (para formulários)
