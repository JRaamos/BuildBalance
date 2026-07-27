# Arquitetura e decisões

## Fluxo principal

1. O usuário autentica em `/auth/login`.
2. O frontend envia o JWT em `Authorization: Bearer`.
3. O guard valida token e status do usuário.
4. O controller delega ao serviço de domínio.
5. Recursos de obra passam pela autorização central.
6. O Prisma executa consultas e agregações no PostgreSQL.
7. Valores financeiros retornam como strings decimais.

## Módulos da API

- `auth`: login, sessão atual e troca de senha.
- `users`: criação e administração de contas.
- `projects`: obra, propriedade, listagem autorizada e arquivo lógico.
- `admin`: compartilhamentos e leitura de auditoria.
- `scopes`: orçamento individual por escopo.
- `expenses`: lançamento, filtro, edição e cancelamento lógico.
- `dashboard`: cálculos gerais e por obra.
- `reports`: projeções financeiras de leitura.
- `categories` e `suppliers`: cadastros auxiliares.
- `audit`: registro sanitizado de operações relevantes.

## Endpoints

### Autenticação

- `POST /auth/login`
- `GET /auth/me`
- `POST /auth/change-password`

### Usuários

- `GET|POST /admin/users`
- `GET|PATCH /admin/users/:id`
- `PATCH /admin/users/:id/status`
- `POST /admin/users/:id/reset-password`

### Obras

- `GET|POST /projects`
- `GET|PATCH|DELETE /projects/:id`
- `GET /dashboard`
- `GET /projects/:id/dashboard`

### Acessos

- `GET|POST /admin/projects/:projectId/access`
- `PATCH|DELETE /admin/projects/:projectId/access/:accessId`
- `GET /admin/users/:userId/project-access`

### Escopos e gastos

- `GET|POST /projects/:projectId/scopes`
- `PATCH|DELETE /scopes/:id`
- `GET|POST /projects/:projectId/expenses`
- `GET|PATCH|DELETE /expenses/:id`

### Relatórios

- `GET /projects/:projectId/reports/financial-summary`
- `GET /projects/:projectId/reports/expenses-by-scope`
- `GET /projects/:projectId/reports/expenses-by-period`

### Auxiliares

- `GET|POST /suppliers`
- `GET|POST /categories`
- `GET /admin/audit`

## Banco

A migration `20260727190000_initial` cria:

- enums de perfil, status e pagamentos;
- `User`, `Project`, `ProjectAccess`, `Scope`, `Expense`;
- `Category`, `Supplier`, `AuditLog`;
- índices de pesquisa e a unicidade `(projectId, userId)`;
- FKs com `RESTRICT` para preservar dados financeiros.

## Identidade visual

O sistema usa azul-marinho para estrutura, verde-petróleo para ações e âmbar para alertas. O logo combina planta de obra, barras financeiras e uma balança. O PNG transparente está em `apps/web/public/brand/buildbalance-logo.png`.
