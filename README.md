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
<<<<<<< ours
=======
pnpm db:migrate
pnpm db:seed
>>>>>>> theirs
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

<<<<<<< ours
=======
## Variables de entorno

- `JWT_SECRET`: firma de access tokens JWT.
- `FRONTEND_ORIGIN`: origen permitido por CORS para la app web.
- `NEXT_PUBLIC_API_URL`: URL base del backend usada por Next.js.

>>>>>>> theirs
## Multi-tenant (base)

Se define desde el día 1:
- `Organization`
- `User` con RBAC mínimo (`admin`, `agent`)
- `EventLog` para auditoría inicial

Todas las entidades de negocio futuras deben incluir `organizationId`.

<<<<<<< ours
## Endpoints iniciales API

- `GET /health`
- `POST /auth/login` (placeholder)
- `POST /auth/logout` (placeholder)
=======
## Endpoints API

- `GET /health`
- `POST /auth/login`
- `GET /auth/me` (requiere `Authorization: Bearer <token>`)

## Flujo de autenticación (local)

1. Ejecutar migraciones y seed:
   ```bash
   pnpm db:migrate
   pnpm db:seed
   ```
2. Levantar app:
   ```bash
   pnpm dev
   ```
3. Abrir `http://localhost:3000/login`.
4. Credenciales demo:
   - Email: `admin@demo.local`
   - Password: `Admin12345!`
5. Si login es correcto redirige a `/dashboard`, que valida token llamando a `GET /auth/me`.
>>>>>>> theirs
