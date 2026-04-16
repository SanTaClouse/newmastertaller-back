# CLAUDE.md — MiTaller Backend

## Contexto del proyecto

Este es el **backend NestJS** de MiTaller, un SaaS multi-tenant de gestión para talleres mecánicos.

**Archivos de referencia (en el directorio padre `../`):**
- `../mitaller-prompt.md` — Especificación completa del MVP: stack, modelo de datos, endpoints, reglas de negocio, seed, criterios de aceptación.
- `../mitaller-prototype.jsx` — Prototipo React de referencia para entender la UX y las entidades de datos usadas en el frontend.

## Stack
- NestJS + TypeScript
- PostgreSQL + TypeORM
- JWT (24h, sin refresh tokens en MVP)
- bcrypt para passwords
- class-validator + class-transformer para DTOs
- nanoid para trackingCode (8 chars alfanumérico uppercase)
- Docker + Docker Compose para dev local
- Deploy: Render

## Arquitectura multi-tenant
- Shared DB, shared schema, con `tenantId: uuid` en cada tabla de negocio
- `TenantContext` via AsyncLocalStorage — inyecta tenantId en cada request
- `TenantGuard` extrae tenantId del JWT y lo pone en el contexto
- **CRÍTICO**: todo query de negocio debe filtrar `WHERE tenantId = :tenantId`
- `@Public()` decorator para rutas sin auth (tracking público, login)

## Módulos
```
auth/           → POST /auth/login, GET /auth/me
tenants/        → CRUD interno
users/          → CRUD interno
clients/        → GET/POST/PATCH/DELETE /clients + /clients/:id/work-orders
vehicles/       → GET/POST/PATCH/DELETE /vehicles
work-orders/    → CRUD + /advance-phase + /set-phase + /complete
expenses/       → POST dentro de work-orders, PATCH/DELETE /expenses/:id
repair-phases/  → CRUD + reorder
stats/          → /stats/dashboard, /stats/weekly, /stats/monthly
car-catalog/    → GET /car-brands, GET /car-brands/:id/models (global, sin tenant)
public-tracking/→ GET /public/tracking/:code (sin auth, datos seguros)
```

## Credenciales demo
- Email: `admin@newmaster.com`
- Password: `AdminPass123!`
- Tenant: `Taller Newmaster` (slug: `newmaster`)

## Comandos clave
```bash
npm run start:dev     # desarrollo con hot reload
npm run migration:generate -- src/database/migrations/NombreMigration
npm run migration:run
npm run seed          # agrega datos si no existen
npm run seed:fresh    # limpia y recarga todo
npm run test
npm run build
```

## Variables de entorno (.env)
```
NODE_ENV=development
PORT=3001
DATABASE_URL=postgresql://user:pass@localhost:5432/mitaller
JWT_SECRET=<openssl rand -hex 32>
JWT_EXPIRES_IN=24h
CORS_ORIGIN=http://localhost:3000,https://mitaller.vercel.app
```

## Reglas críticas
1. Aislamiento de tenants — ningún query devuelve datos de otro tenant
2. Ganancia neta = `totalPrice - SUM(expenses.cost)` — calculada en backend
3. Al crear WorkOrder → auto-crear primer WorkOrderPhaseLog con fase orderIndex:1
4. Al avanzar fase → cerrar log actual (completedAt) + abrir nuevo
5. Al completar orden → cerrar fase + status:'completed' + completedAt
6. trackingCode: nanoid(8) uppercase, retry en colisión
7. Soft delete con deletedAt en clientes, vehículos, órdenes, tenants, users
