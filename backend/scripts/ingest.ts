/**
 * Ingesta del archivo de Talento Humano (03-empleados-banco-andino.xlsx) por línea de
 * comandos. Implementa RF-07..RF-12; la lógica real vive en
 * ../src/modules/ingestion/ingestion.core.ts (compartida con el endpoint de carga del
 * frontend, ver ingestion.service.ts) para no duplicar reglas de negocio.
 *
 * Ejecutar: npm run seed:ingest
 * Variable de entorno opcional: INGEST_FILE (por defecto /data/empleados.xlsx, el
 * montaje que usa docker-compose.yml).
 */
import { readFileSync } from 'fs';
import { PrismaClient } from '@prisma/client';
import { runIngestion } from '../src/modules/ingestion/ingestion.core';

const prisma = new PrismaClient();
const FILE = process.env.INGEST_FILE ?? '/data/empleados.xlsx';

async function main() {
  const buffer = readFileSync(FILE);
  const resumen = await runIngestion(prisma, buffer, FILE);

  console.log(`\n=== Resumen de carga (batch ${resumen.batchId}) — ${resumen.nombreArchivo} ===`);
  console.log(
    `Total: ${resumen.totalFilas} | OK: ${resumen.filasOk} | Advertencia: ${resumen.filasAdvertencia} | Rechazadas: ${resumen.filasRechazadas}`,
  );

  const noOk = resumen.filas.filter((f) => f.estado !== 'OK');
  if (noOk.length > 0) {
    console.log('\nFilas con advertencia o rechazadas:');
    console.table(noOk.map((f) => ({ fila: f.fila, estado: f.estado, codigo_empleado: f.codigoEmpleado, motivo: f.motivo })));
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
