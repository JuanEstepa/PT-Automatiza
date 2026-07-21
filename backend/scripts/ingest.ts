/**
 * Ingesta del archivo de Talento Humano (03-empleados-banco-andino.xlsx).
 * Implementa RF-07..RF-12 y produce el resumen de carga (IngestionBatch).
 *
 * Reglas clave (ver MODELO-DATOS.md §4):
 *  - Rechazo (crítico): sin numero_documento o sin tipo_doc.
 *  - Advertencia (no crítico): sin email / telefono / id_biostar.
 *  - Normalización: país, tipo_doc, estado, sede, fechas, número de documento.
 *  - Deduplicación: por (documentType, numeroNormalizado); ancla codigo_empleado.
 *  - Eliminación: centro_costo y tipo_contrato NO se cargan (RF-12).
 *
 * Ejecutar: npm run seed:ingest
 */
import { PrismaClient } from '@prisma/client';
import * as ExcelJS from 'exceljs';

const prisma = new PrismaClient();
const FILE = process.env.INGEST_FILE ?? '/data/empleados.xlsx';

// --- Diccionarios de normalización (derivados de los datos reales) ---
const PAIS: Record<string, string> = {
  colombia: 'CO',
  panamá: 'PA', panama: 'PA', 'pa': 'PA', panamaa: 'PA',
};
const TIPO_DOC: Record<string, string> = {
  cc: 'CC', ce: 'CE', pep: 'PEP',
  pas: 'PAS', pa: 'PAS',           // pasaporte escrito de 2 formas
  cip: 'CIP',                       // cédula Panamá (archivo usa CIP; validar PEP vs CIP con cliente)
  n: 'N', e: 'E',
};
const ESTADO: Record<string, string> = {
  activo: 'ACTIVO', a: 'ACTIVO',
  inactivo: 'INACTIVO', retirado: 'INACTIVO',
};
const SEDE: Record<string, string> = {
  'bog-tor': 'BOG-TOR', 'bogota': 'BOG-TOR', 'bogotá d.c.': 'BOG-TOR', // OJO: ambiguo torre vs CD -> revisar
  'bog-cd': 'BOG-CD', 'med-01': 'MED-01', 'cal-01': 'CAL-01',
  'pty-01': 'PTY-01', 'chi-01': 'CHI-01',
  // 'BAQ-01' (Barranquilla) NO está en el catálogo de 6 sedes -> marcar para revisión
};

function limpiarNumeroDoc(v: unknown): string {
  let s = String(v ?? '').trim();
  // notación científica de Excel (1.02E+09) -> entero
  if (/e\+/i.test(s)) s = BigInt(Math.round(Number(s))).toString();
  return s.replace(/[.\s]/g, '');
}

function parseFecha(v: unknown): Date | null {
  if (v instanceof Date) return v;
  if (v == null || v === '') return null;
  const s = String(v).trim();
  // TODO: soportar '2022-11-03', '15/03/2022', '3 de abril de 2021'
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

async function main() {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(FILE);

  // 1) Sedes (hoja limpia) -> catálogo
  // TODO: poblar Country + Site desde la hoja "Sedes".

  // 2) Empleados -> normalizar, validar, deduplicar, persistir
  const ws = wb.getWorksheet('Empleados')!;
  let ok = 0, rechazadas = 0;
  const resultados: { fila: number; estado: string; motivo?: string }[] = [];

  ws.eachRow((row, i) => {
    if (i === 1) return; // header
    // TODO: mapear columnas, aplicar diccionarios, validar críticos vs no críticos,
    // registrar resultado por fila. Ejemplo de política:
    //   if (!numeroDoc || !tipoDoc) -> RECHAZADO ("falta documento")
    //   else if (!email) -> ADVERTENCIA ("sin email"); persiste igual
  });

  // 3) Guardar resumen de carga (RF-11)
  const batch = await prisma.ingestionBatch.create({
    data: {
      nombreArchivo: FILE,
      totalFilas: ws.rowCount - 1,
      filasOk: ok,
      filasRechazadas: rechazadas,
    },
  });

  console.log(`\n=== Resumen de carga (batch ${batch.id}) ===`);
  console.log(`Total: ${ws.rowCount - 1} | OK: ${ok} | Rechazadas: ${rechazadas}`);
  console.table(resultados.filter((r) => r.estado !== 'OK'));
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
