# lookin-crm

Monorepo base para CRM SaaS multi-tenant.

## Stack

- **Monorepo:** pnpm workspaces
- **API:** NestJS + Prisma + PostgreSQL + Redis (BullMQ-ready)
- **Web:** Next.js App Router + Tailwind + shadcn/ui + Framer Motion
- **Infra local:** docker-compose (postgres + redis)

## Estructura

```
apps/
  api/   # NestJS API
  web/   # Next.js frontend
```

## Setup

```bash
cp .env.example .env
pnpm install
pnpm dev:infra
```

## Comandos

- Instalar deps:
  ```bash
  pnpm install
  ```
- Desarrollo (api + web):
  ```bash
  pnpm dev
  ```
- Levantar infra local:
  ```bash
  pnpm dev:infra
  ```
- Bajar infra local:
  ```bash
  pnpm dev:down
  ```
- Migraciones Prisma:
  ```bash
  pnpm db:migrate
  ```
- Seed base:
  ```bash
  pnpm db:seed
  ```

## Multi-tenant (base)

Se define desde el día 1:
- `Organization`
- `User` con RBAC mínimo (`admin`, `agent`)
- `EventLog` para auditoría inicial

Todas las entidades de negocio futuras deben incluir `organizationId`.

## Endpoints iniciales API

- `GET /health`
- `POST /auth/login` (placeholder)
- `POST /auth/logout` (placeholder)
