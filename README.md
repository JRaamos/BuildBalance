# BuildBalance

Sistema web para gestão financeira de reformas. Organiza obras, orçamentos por escopo, gastos gerais ou vinculados, fornecedores, compartilhamentos e auditoria.

![BuildBalance](apps/web/public/brand/buildbalance-logo.png)

## Arquitetura

Monorepo npm workspaces:

```text
apps/
├── api/  NestJS + Prisma + PostgreSQL
└── web/  React + Vite + TypeScript
```

O backend é a autoridade para acesso e cálculos financeiros. O frontend usa Redux Toolkit e RTK Query como camada única de comunicação.

## Requisitos

- Node.js 20+
- npm 10+
- Docker com Docker Compose

## Instalação

```bash
npm install
cp .env.example .env
docker compose up -d postgres
npm run db:generate
npm run db:deploy
npm run db:seed
npm run dev
```

Acesse:

- Web: http://localhost:5173
- API: http://localhost:3000
- Swagger: http://localhost:3000/api/docs

O login inicial usa `ADMIN_EMAIL` e `ADMIN_PASSWORD` definidos no `.env`. Troque a senha de exemplo antes do seed.

## Scripts

| Comando | Finalidade |
| --- | --- |
| `npm run dev` | Web e API em modo desenvolvimento |
| `npm run dev:web` | Somente o frontend |
| `npm run dev:api` | Somente a API |
| `npm run build` | Build de produção |
| `npm run lint` | ESLint em todos os apps |
| `npm test` | Testes do backend |
| `npm run db:generate` | Gera o Prisma Client |
| `npm run db:migrate` | Cria/aplica migrations em desenvolvimento |
| `npm run db:deploy` | Aplica migrations existentes sem prompt |
| `npm run db:seed` | Cria administrador e categorias iniciais |
| `npm run db:studio` | Abre o Prisma Studio |

## Variáveis de ambiente

Consulte [`.env.example`](.env.example). As obrigatórias são:

- `DATABASE_URL`
- `JWT_SECRET`
- `ADMIN_NAME`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`
- `CORS_ORIGIN`
- `VITE_API_URL`

`SWAGGER_ENABLED=false` desativa a documentação da API em ambientes onde ela não deve ser pública.

## Deploy na Vercel

Crie dois projetos na Vercel usando este mesmo repositório:

| Projeto | Root Directory | Framework |
| --- | --- | --- |
| API | `apps/api` | NestJS |
| Frontend | `apps/web` | Vite |

### API

A API de produção usa `https://build-balance-api.vercel.app`. Configure no projeto da API:

```dotenv
DATABASE_URL=postgresql://...
JWT_SECRET=uma-chave-longa-e-aleatoria
JWT_EXPIRES_IN=1d
CORS_ORIGIN=https://SEU-FRONTEND.vercel.app
ALLOW_VERCEL_PREVIEWS=true
SWAGGER_ENABLED=false
```

O PostgreSQL precisa ser hospedado e acessível pela internet; o container local do Docker não está disponível para uma função da Vercel. Prefira a URL com pool de conexões oferecida pelo provedor. O build gera o Prisma Client, aplica as migrations existentes e compila o NestJS.

Depois do deploy, valide:

- API: `https://build-balance-api.vercel.app/`
- Saúde: `https://build-balance-api.vercel.app/health`

### Frontend

Configure no projeto do frontend:

```dotenv
VITE_API_URL=https://build-balance-api.vercel.app
```

O arquivo `apps/web/vercel.json` preserva as rotas da SPA ao acessar ou atualizar URLs internas diretamente. O frontend também usa a URL de produção acima como fallback de build; a variável continua recomendada para permitir ambientes de preview separados.

## Perfis e permissões

- `ADMIN`: administra usuários, acessa todas as obras, compartilhamentos e auditoria.
- `MANAGER`: cria obras próprias e altera obras com acesso `EDIT`.
- `VIEWER`: consulta obras próprias ou compartilhadas, sem alteração financeira.
- `VIEW`: consulta dashboard, escopos, gastos e relatórios.
- `EDIT`: consulta e altera obra, escopos e gastos.

As regras são validadas pela `ProjectAuthorizationService`. A ausência de acesso responde como obra não encontrada para reduzir enumeração de IDs.

## Regras financeiras

- Gastos `PAID` e `PENDING` compõem o total.
- Gastos `CANCELLED` são preservados e excluídos dos cálculos.
- Gastos com `scopeId` reduzem o saldo geral e o saldo do escopo.
- Gastos sem `scopeId` aparecem como gasto geral.
- Valores usam `Decimal(14,2)` no banco e são enviados como strings.
- Totais e saldos não são persistidos; são calculados a partir dos lançamentos.

## Funcionalidades

- Login JWT e alteração de senha
- Gestão administrativa de usuários
- Obras próprias, compartilhadas e arquivamento lógico
- Compartilhamentos por obra `VIEW` ou `EDIT`
- Escopos com orçamento e indicador de excesso
- Gastos manuais, simulação de saldo e cancelamento lógico
- Dashboard geral e por obra
- Relatórios financeiros
- Fornecedores próprios e categorias globais
- Auditoria de operações relevantes
- Estados de carregamento, erro e vazio
- Layout responsivo em português do Brasil

## Segurança

- bcrypt com custo 12
- JWT validado a cada requisição e bloqueio de usuário inativo
- Helmet, CORS configurável e rate limit específico no login
- DTOs com whitelist, limites de tamanho e validação
- E-mail normalizado e único
- Senhas e tokens nunca entram em respostas ou auditoria
- FKs financeiras usam `RESTRICT`; não há cascata destrutiva
- Proteção contra desativação do último administrador ativo
- Autorização por obra aplicada também a escopos, gastos, dashboard e relatórios

## Testes

Os testes atuais cobrem:

- usuário inativo e resposta segura de login;
- isolamento horizontal entre usuários;
- `VIEW` sem edição;
- `EDIT`, proprietário e administrador;
- totais pago/pendente, gastos gerais, saldo e escopo acima do orçamento.

Execute `npm test`.

## Limitações do MVP

- O token de acesso é armazenado no navegador e não há refresh token/revogação por dispositivo.
- Não há exportação de relatórios, upload de comprovantes ou edição de fornecedores/categorias.
- O build web ainda é entregue em um bundle principal; code splitting pode ser aplicado na próxima fase.
- A auditoria npm de produção ainda reporta o alerta `GHSA-qwww-vcr4-c8h2` no React Router 7.18.1; ele afeta o modo RSC/Server Actions, que esta SPA Vite não utiliza. Não há versão estável publicada fora de todas as faixas conflitantes no momento desta implementação.
- Build, lint e testes automatizados foram validados; comportamento com PostgreSQL e navegador real depende da infraestrutura local.

## Próxima fase recomendada

Adicionar refresh token rotativo em cookie `HttpOnly`, testes E2E com PostgreSQL, edição completa de cadastros, exportação CSV/PDF e divisão do bundle por rota.
