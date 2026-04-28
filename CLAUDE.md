# Zenob — Instruções para Claude Code

## O que é o Zenob
SaaS de administração de aluguéis para proprietários particulares. NÃO é marketplace. Leia CONTEXTO.md para detalhes.

## Estrutura
zenob/
├── backend/     → NestJS + Prisma 5.22 + PostgreSQL 16
└── zenob-web/   → Next.js 14 + Tailwind + shadcn/ui

## Como rodar
```bash
# Backend
docker start zenob-db
cd ~/zenob/backend
DATABASE_URL="postgresql://zenob:zenob123@localhost:5432/zenob_dev?schema=public" ./node_modules/.bin/ts-node --transpile-only src/main.ts

# Frontend
cd ~/zenob/zenob-web
npm run dev
```

## API
Base URL: http://localhost:3000/api/v1

## Regras do backend
- NUNCA atualizar Prisma além da versão 5.22.0
- accountId hardcoded: 'account-teste-001' até Clerk ser integrado
- PrismaClient: sempre `new PrismaClient()` sem opções
- Novos módulos em: src/modules/nome/  (*.module.ts, *.controller.ts, *.service.ts)
- Idioma dos comentários: português brasileiro

## Regras do frontend
- App Router (src/app/)
- Componentes em src/components/
- Ícones: Lucide React
- Tabelas: TanStack Table v8
- Formulários: React Hook Form + Zod
- Idioma da UI: português brasileiro

## Campos importantes do schema

### Property (imóveis)
- iptuCode: inscrição imobiliária IPTU (obrigatório no cadastro)
- waterRegistration: matrícula de água/Cagepa (obrigatório)
- energyRegistration: matrícula de energia/Energisa (obrigatório)
- deedNumber: número da escritura (opcional)
- Link IPTU: https://campinagrande.pb.gov.br/iptu/

### Tenant (inquilinos)
- fullName (não name)
- employer (não occupation)
- monthlyIncome: Decimal

### Receivable (cobranças)
- status: PENDING | PAID | PARTIAL | OVERDUE | RENEGOTIATED | WAIVED
- paidAmount: quanto foi pago
- balanceAmount: quanto ainda deve
- Suporta pagamento parcial e crédito para mês seguinte

## Cores do design system
- Primary: #3B6D11
- Primary dark: #27500A
- Primary light bg: #EAF3DE
- Warning: #BA7517 / bg: #FAEEDA
- Error: #E24B4A / bg: #FCEBEB

## Quando usar cada modelo de IA

**Regra:** Ao final de cada resposta (ou quando a tarefa sugerir próxima ação), indicar qual modelo usar para o próximo passo.

| Situação | Modelo | Ferramenta |
|---|---|---|
| Novos módulos NestJS, rotas CRUD, services simples, schemas Prisma, componentes Next.js, formulários, bugs gerais | MiniMax 2.7 | Claude Code |
| Refatorações críticas, lógica de cobrança/financeiro, bugs difíceis que MiniMax não resolveu | Sonnet 4.6 | Claude Code |
| Arquitetura muito complexa, problemas que Sonnet não resolveu | Opus 4.7 | Claude Code |
| Componentes visuais Tailwind, layout, UI completa, shadcn/ui | Gemini 3.1 Pro | Antigravity |
| Decisões arquiteturais, debug difícil, análise de trade-offs | Claude.ai | — |
| Protótipos, design system, wireframes | Claude Design | — |
| Documentação, changelogs, organização de arquivos | Claude Cowork | — |

**Regra:** Preferir MiniMax sempre que possível — escalar para Sonnet/Opus só quando a complexidade exigir.

**Exemplos de indicação ao final da resposta:**
- "Próximo passo → **MiniMax 2.7** no Claude Code"
- "Lógica de pagamento parcial → **Sonnet 4.6** no Claude Code"
- "Novo componente visual → **Gemini 3.1 Pro** no Antigravity"
