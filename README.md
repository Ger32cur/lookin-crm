# lookin-crm

Monorepo base para CRM SaaS multi-tenant.

## Stack

- Monorepo: pnpm workspaces
- API: NestJS + Prisma + PostgreSQL + Redis
- Web: Next.js App Router + Tailwind + shadcn/ui + Framer Motion
- Infra local: docker-compose (postgres + redis)

## Estructura

```text
apps/
  api/   # NestJS API
  web/   # Next.js frontend
```

## Setup local

```bash
cp .env.example .env
pnpm install
pnpm dev:infra
pnpm db:migrate
pnpm db:seed
pnpm dev
```

## Variables de entorno

- `JWT_SECRET`: secreto de firma para JWT.
- `JWT_EXPIRATION`: duración del access token (ejemplo: `1h`).
- `FRONTEND_ORIGIN`: origen permitido por CORS para la app web.
- `NEXT_PUBLIC_API_URL`: URL base del backend usada por Next.js.

## Endpoints API

- `GET /health` (público)
- `POST /api/auth/login` (público)
- `GET /api/auth/me` (requiere `Authorization: Bearer <token>`)

Todos los endpoints bajo `/api/*` están protegidos por JWT por defecto; los públicos se marcan explícitamente.

## Flujo de autenticación local

1. Ejecutar migraciones y seed:
   ```bash
   pnpm db:migrate
   pnpm db:seed
   ```
2. Abrir `http://localhost:3000/login`.
3. Iniciar sesión con:
   - Email: `admin@demo.local`
   - Password: `Admin12345!`
4. El login consume `POST /api/auth/login`, guarda token y redirige a `/dashboard`.
5. `/dashboard` consume `GET /api/auth/me` para mostrar email, rol y `organizationId`.

## Comandos útiles

- `pnpm dev`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
