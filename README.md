# Sistema de Control de Acceso — Banco Andino

Capa propia sobre BioStar 2 para gestionar empleados, calcular aforo por sede y
generar reportes de auditoría exportables. Prueba técnica Full Stack.

> **Documentos de criterio (leer primero):**
> [`ALCANCE.md`](./ALCANCE.md) · [`REQUISITOS.md`](./REQUISITOS.md) · [`ARQUITECTURA.md`](./ARQUITECTURA.md) · [`MODELO-DATOS.md`](./MODELO-DATOS.md)

## Stack

| Capa | Tecnología |
|---|---|
| Frontend | React + Vite + TypeScript |
| Backend | NestJS (TypeScript) |
| Base de datos | PostgreSQL |
| ORM | Prisma |
| CI/CD | GitHub Actions |
| Empaquetado | Docker / docker-compose |

Arquitectura: **monolito modular**. Justificación en `ARQUITECTURA.md`.

## Levantar el proyecto (Docker)

Requisitos: Docker y Docker Compose.

```bash
cp backend/.env.example backend/.env
docker compose up --build
```

Esto levanta:
- **db**: PostgreSQL en `localhost:5432`
- **backend**: NestJS en `http://localhost:3000`
- **frontend**: React en `http://localhost:5173`

## Poblar la base con el archivo de Talento Humano

Con los servicios arriba:

```bash
docker compose exec backend npm run db:migrate
docker compose exec backend npm run seed:ingest   # carga 03-empleados-banco-andino.xlsx
```

El comando imprime el **resumen de carga** (registros OK / rechazados / advertencias y su motivo).

## Desarrollo local (sin Docker)

```bash
# backend
cd backend && npm install && npm run start:dev
# frontend (otra terminal)
cd frontend && npm install && npm run dev
```

## Estructura

```
backend/   NestJS (módulos: employees, sites, ingestion, occupancy, reports, biostar)
frontend/  React + Vite (tablero de aforo, carga de Excel, reportes)
IA/        Conversaciones con IA (entregable)
```

## Estado

Ver la sección "Lo que no se alcanzó a hacer" en `ALCANCE.md`.
