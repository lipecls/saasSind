# SindGestão — gestão de sindicatos de trabalhadores

Sistema para a gestão de **um sindicato**: filiados, financeiro, convenções, atendimentos e eventos.

## Módulos

| Módulo | O que faz |
| --- | --- |
| **Painel** | Filiados ativos, inadimplência, resultado do mês, atendimentos, próximos eventos, convenções vencendo, aniversariantes |
| **Filiados** | Cadastro completo (CPF validado, matrícula automática), vínculo com empresa, situação (ativo/afastado/aposentado/desfiliado), dependentes, histórico financeiro e de atendimentos, **carteirinha** para impressão |
| **Empresas** | Empresas da base, nº de trabalhadores x filiados (taxa de sindicalização), ACTs da empresa |
| **Convenções** | CCTs e ACTs: vigência, data-base, piso, reajuste, cláusulas; alerta de vencimento (90 dias) |
| **Financeiro** | Geração de mensalidades em lote por competência (sem duplicar), cobranças avulsas (contribuição assistencial/negocial, a filiado ou empresa), baixa de pagamento com lançamento automático no caixa, estorno, inadimplência, caixa de receitas e despesas por categoria |
| **Atendimentos** | Jurídico, homologações, denúncias e orientações com protocolo, responsável e histórico de andamentos |
| **Eventos** | Assembleias, reuniões e cursos com pauta, lista de presença (por matrícula ou CPF) e ata |
| **Comunicados** | Avisos à categoria |
| **Configurações** | Dados do sindicato, mensalidade padrão, dia de vencimento, usuários (Administrador / Operador) |

## Stack

Next.js 15 (App Router + Server Actions) · React 19 · TypeScript · PostgreSQL · Prisma · sessão JWT em cookie httpOnly (`jose`) · senhas com bcrypt.

## Instalação no servidor do sindicato

Veja o passo a passo em **[INSTALACAO.md](INSTALACAO.md)** (Docker ou manual no Ubuntu, backup e atualização).

## Rodando para desenvolvimento

Requisitos: Node 20+ e PostgreSQL.

```bash
cd sindicato
cp .env.example .env          # ajuste DATABASE_URL e SESSION_SECRET (32+ caracteres)
npm install
npx prisma migrate deploy     # cria as tabelas
npm run db:seed               # opcional: sindicato de demonstração
npm run dev                   # http://localhost:3000
```

Login da demonstração: `admin@demo.org.br` / `sindicato123` (operador: `juridico@demo.org.br`).
Sem o seed, o primeiro acesso abre a **instalação** (`/instalacao`): você informa os dados do sindicato e cria o administrador. Depois disso a instalação é bloqueada e os demais usuários são criados em *Configurações*.

## Testes

```bash
npm test                      # unitários (CPF/CNPJ, valores, datas/fuso)
npm run typecheck
# ponta a ponta (Playwright), com o app rodando na porta 3100 e o seed aplicado:
node e2e/fluxos.js
```

## Arquitetura

- `prisma/schema.prisma` — modelo de dados. As entidades guardam `sindicatoId` (há um único sindicato, criado na instalação).
- `src/lib/sessao.ts` — `usuarioAtual()` valida o cookie **e** o usuário no banco a cada requisição; `exigirAdmin()` para áreas restritas.
- `src/middleware.ts` — redireciona quem não está logado para `/login`.
- Valores monetários em **centavos** (inteiros); datas "só dia" salvas ao meio-dia UTC; horários de eventos interpretados em horário de Brasília.
- `src/app/(sistema)/<módulo>/acoes.ts` — server actions de cada módulo; páginas são Server Components.

## Próximos passos sugeridos

- Integração de boletos/PIX (ex.: Asaas, Efí, Mercado Pago) com baixa automática por webhook
- Portal do filiado (2ª via, carteirinha digital, atualização cadastral)
- Envio de comunicados por e-mail/WhatsApp
- Importação de filiados por planilha e relatórios em PDF/Excel
- Log de auditoria e conformidade com a LGPD (consentimento, exportação/anonimização de dados)
