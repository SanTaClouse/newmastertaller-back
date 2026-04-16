# MiTaller — Backend

Backend de **MiTaller**, un SaaS multi-tenant de gestión para talleres mecánicos. Construido con NestJS, TypeORM y PostgreSQL.

## Stack

- **NestJS** + TypeScript
- **PostgreSQL 16** con **TypeORM**
- **JWT** para autenticación (24h)
- **bcrypt** para passwords
- **Docker + Docker Compose** para desarrollo local
- **Deploy**: Render

## Setup local

### Requisitos
- Node 20+
- Docker y Docker Compose

### Pasos

```bash
# 1. Clonar e instalar dependencias
git clone <repo>
cd mitaller-backend
npm install

# 2. Variables de entorno
cp .env.example .env
# Editar .env con tus valores

# 3. Levantar PostgreSQL con Docker
docker-compose up -d postgres

# 4. Correr migraciones
npm run migration:run

# 5. Cargar datos de prueba
npm run seed

# 6. Iniciar servidor
npm run start:dev
# → http://localhost:3001/api/v1
```

### Con Docker completo (backend + DB)

```bash
docker-compose up --build
```

## Credenciales demo

| Campo    | Valor               |
|----------|---------------------|
| Email    | admin@newmaster.com |
| Password | AdminPass123!       |
| Tenant   | Taller Newmaster    |

## Estructura de carpetas

```
src/
  config/           → TypeORM y JWT config
  common/           → Guards, interceptors, decorators, context
  modules/
    auth/           → Login + JWT strategy
    clients/        → CRUD Clientes
    vehicles/       → CRUD Vehículos
    work-orders/    → CRUD Órdenes + fases + completar
    expenses/       → Gastos por orden
    repair-phases/  → Fases configurables por tenant
    stats/          → Dashboard, weekly, monthly
    car-catalog/    → Marcas y modelos (global)
    public-tracking/→ Vista pública sin auth
  database/
    migrations/     → Migraciones TypeORM
    seeds/          → Datos demo
```

## Endpoints principales

```
POST   /api/v1/auth/login
GET    /api/v1/auth/me

GET    /api/v1/clients
POST   /api/v1/clients
GET    /api/v1/work-orders
POST   /api/v1/work-orders
POST   /api/v1/work-orders/:id/advance-phase
POST   /api/v1/work-orders/:id/complete
POST   /api/v1/work-orders/:workOrderId/expenses
GET    /api/v1/stats/dashboard
GET    /api/v1/car-brands
GET    /api/v1/public/tracking/:code   (sin auth)
```

## Scripts

```bash
npm run start:dev       # Hot reload
npm run migration:run   # Correr migraciones
npm run seed            # Seed de datos
npm run seed:fresh      # Limpiar y reseedear
npm run test            # Tests unitarios
npm run build           # Build producción
```

## Deploy en Render

1. Crear **PostgreSQL** en Render
2. Crear **Web Service** Node.js:
   - Build: `npm install && npm run build`
   - Start: `npm run migration:run && node dist/main`
3. Variables de entorno:
   - `DATABASE_URL` → connection string de Render PostgreSQL
   - `JWT_SECRET` → `openssl rand -hex 32`
   - `CORS_ORIGIN` → URL del frontend en Vercel
   - `NODE_ENV` → `production`
