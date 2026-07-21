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

Requisitos: Docker y Docker Compose. Si algún puerto (5432, 3000 o 5173) ya está
ocupado por otro proceso en tu máquina, ajusta el mapeo de puertos en
`docker-compose.yml` antes de levantar.

```bash
cp backend/.env.example backend/.env
docker compose up --build
```

Esto levanta:
- **db** — PostgreSQL en `localhost:5432`
- **backend** — API NestJS en `http://localhost:3000` (rutas bajo `/api`)
- **frontend** — React en `http://localhost:5173`

## Poblar la base con datos reales

Con los servicios arriba, en otra terminal:

```bash
# 1) Migraciones (crea las tablas)
docker compose exec backend npm run db:migrate

# 2) Ingesta del Excel real de Talento Humano (RF-07..RF-12)
docker compose exec backend npm run seed:ingest

# 3) Eventos de acceso simulados, para que el aforo y los reportes tengan datos (RF-19)
curl -X POST "http://localhost:3000/api/biostar/simulate?dias=7"
```

El paso 2 imprime en consola el **resumen de carga** (registros OK / con advertencia /
rechazados y su motivo — el mismo resumen que se ve en la pantalla "Última carga" del
frontend). El paso 3 también se puede disparar desde el botón **"Regenerar eventos
simulados"** en la pantalla de Aforo.

Con eso, abre `http://localhost:5173` — las 4 secciones ya tienen datos:

| Sección | Qué muestra |
|---|---|
| **Aforo en tiempo real** | Ocupación actual por sede (RF-13/RF-18), con detalle de quién está adentro |
| **Empleados** | Directorio filtrable por sede, estado y búsqueda |
| **Reportes** | Auditoría de accesos filtrable por fecha/sede, exportable a Excel y CSV (RF-16/RF-17) |
| **Última carga** | Carga del Excel (drag & drop) y resumen fila a fila de la última ingesta (RF-11) |

## Desarrollo local (sin Docker)

```bash
# base de datos (o usa un Postgres local propio)
docker compose up -d db

# backend
cd backend && npm install && npm run db:migrate:dev && npm run start:dev
# frontend (otra terminal)
cd frontend && npm install && npm run dev
```

## Tests y CI

```bash
cd backend && npm test    # 30 tests: normalización + resolución de duplicados (RF-08/RF-09)
cd frontend && npm run build
```

GitHub Actions (`.github/workflows/ci.yml`) corre lint + test en cada push a `main` y en
cada pull request, para backend y frontend por separado.

## Estructura

```
backend/   NestJS (módulos: employees, sites, ingestion, occupancy, reports, biostar)
frontend/  React + Vite (Aforo, Empleados, Reportes, Última carga)
IA/        Conversaciones con IA (entregable)
```

## Estado

Ver la sección "Lo que no se alcanzó a hacer" en `ALCANCE.md`.
