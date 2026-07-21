/**
 * Núcleo de la ingesta del Excel de Talento Humano (RF-07..RF-12). No depende de
 * NestJS: lo usan por igual el script de línea de comandos (scripts/ingest.ts) y el
 * endpoint de carga desde el frontend (ingestion.service.ts), para no duplicar reglas.
 */
import * as ExcelJS from 'exceljs';
import type { PrismaClient } from '@prisma/client';
import {
  normalizeEstado,
  normalizeFecha,
  normalizeJornada,
  normalizeNumeroDocumento,
  normalizePais,
  normalizeSede,
  normalizeTipoDoc,
  trimOrNull,
} from './normalizers';
import type {
  IngestionSummary,
  RawEmployeeRow,
  RawSiteRow,
  RowEstado,
  RowResultDto,
} from './ingestion.types';

/**
 * Catálogo de tipos de documento por país (RF-02). No viene en el Excel: es una regla
 * de negocio fija, documentada en REQUISITOS.md (RF-02, C-09) y MODELO-DATOS.md §4.
 * 'CIP' es el código que realmente usa el archivo real para la cédula panameña; 'PEP'
 * se deja seedeado para Colombia aunque no aparezca en los datos (discrepancia ya
 * documentada en MODELO-DATOS.md §4, a validar con el cliente).
 */
const CATALOGO_TIPOS_DOC: Record<'CO' | 'PA', Array<{ codigo: string; nombre: string; patron: string }>> = {
  CO: [
    { codigo: 'CC', nombre: 'Cédula de ciudadanía', patron: '^\\d{6,10}$' },
    { codigo: 'CE', nombre: 'Cédula de extranjería', patron: '^\\d{6,10}$' },
    { codigo: 'PEP', nombre: 'Permiso especial de permanencia', patron: '^\\d{6,12}$' },
    { codigo: 'PAS', nombre: 'Pasaporte', patron: '^[A-Za-z0-9]{5,12}$' },
  ],
  PA: [
    { codigo: 'CIP', nombre: 'Cédula panameña', patron: '^\\d{1,2}-\\d{1,4}-\\d{1,6}$' },
    { codigo: 'E', nombre: 'Cédula de extranjero residente', patron: '^E-\\d{1,2}-\\d{1,4}-\\d{1,6}$' },
    { codigo: 'N', nombre: 'Cédula de naturalizado', patron: '^N-\\d{1,2}-\\d{1,4}-\\d{1,6}$' },
    { codigo: 'PAS', nombre: 'Pasaporte', patron: '^[A-Za-z0-9]{5,12}$' },
  ],
};

const NOMBRE_PAIS: Record<'CO' | 'PA', string> = { CO: 'Colombia', PA: 'Panamá' };

// ---------------------------------------------------------------------------
// Lectura de las hojas del Excel
// ---------------------------------------------------------------------------

function cellsToRow(sheet: ExcelJS.Worksheet, headerMap: Map<string, number>, rowIndex: number) {
  const row = sheet.getRow(rowIndex);
  const get = (header: string) => row.getCell(headerMap.get(header)!).value;
  return { row, get };
}

function buildHeaderMap(sheet: ExcelJS.Worksheet): Map<string, number> {
  const map = new Map<string, number>();
  sheet.getRow(1).eachCell((cell, colNumber) => {
    const header = String(cell.value ?? '').trim();
    if (header) map.set(header, colNumber);
  });
  return map;
}

function readSiteRows(sheet: ExcelJS.Worksheet): RawSiteRow[] {
  const headers = buildHeaderMap(sheet);
  const rows: RawSiteRow[] = [];
  for (let i = 2; i <= sheet.rowCount; i++) {
    const { get } = cellsToRow(sheet, headers, i);
    if (!get('codigo_sede')) continue;
    rows.push({
      codigoSede: get('codigo_sede'),
      nombreSede: get('nombre_sede'),
      ciudad: get('ciudad'),
      pais: get('pais'),
      direccion: get('direccion'),
      aforoMaximo: get('aforo_maximo'),
      activa: get('activa'),
    });
  }
  return rows;
}

function readEmployeeRows(sheet: ExcelJS.Worksheet): RawEmployeeRow[] {
  const headers = buildHeaderMap(sheet);
  const rows: RawEmployeeRow[] = [];
  for (let i = 2; i <= sheet.rowCount; i++) {
    const { get } = cellsToRow(sheet, headers, i);
    // Fila totalmente vacía (a veces Excel deja filas fantasma al final): ignorar.
    if (!get('codigo_empleado') && !get('primer_nombre')) continue;
    rows.push({
      fila: i,
      codigoEmpleado: get('codigo_empleado'),
      primerNombre: get('primer_nombre'),
      segundoNombre: get('segundo_nombre'),
      primerApellido: get('primer_apellido'),
      segundoApellido: get('segundo_apellido'),
      tipoDoc: get('tipo_doc'),
      numeroDocumento: get('numero_documento'),
      pais: get('pais'),
      sede: get('sede'),
      area: get('area'),
      cargo: get('cargo'),
      fechaIngreso: get('fecha_ingreso'),
      fechaRetiro: get('fecha_retiro'),
      estado: get('estado'),
      email: get('email'),
      telefono: get('telefono'),
      idBiostar: get('id_biostar'),
      tarjetaRfid: get('tarjeta_rfid'),
      nivelAcceso: get('nivel_acceso'),
      jornada: get('jornada'),
    });
  }
  return rows;
}

// ---------------------------------------------------------------------------
// Seed de catálogos (Country, Site, DocumentType)
// ---------------------------------------------------------------------------

async function seedSitesAndCountries(prisma: PrismaClient, siteRows: RawSiteRow[]): Promise<void> {
  for (const raw of siteRows) {
    const isoCode = normalizePais(raw.pais);
    if (!isoCode) continue; // hoja "Sedes" viene limpia; si faltara país, no hay dónde colgar la sede.

    const country = await prisma.country.upsert({
      where: { isoCode },
      update: {},
      create: { isoCode, nombre: NOMBRE_PAIS[isoCode] },
    });

    const codigoSede = trimOrNull(raw.codigoSede);
    if (!codigoSede) continue;

    await prisma.site.upsert({
      where: { codigoSede },
      update: {
        nombre: trimOrNull(raw.nombreSede) ?? codigoSede,
        ciudad: trimOrNull(raw.ciudad) ?? '',
        countryId: country.id,
        direccion: trimOrNull(raw.direccion),
        aforoMaximo: typeof raw.aforoMaximo === 'number' ? raw.aforoMaximo : null,
        activa: String(raw.activa ?? '').trim().toUpperCase() !== 'NO',
      },
      create: {
        codigoSede,
        nombre: trimOrNull(raw.nombreSede) ?? codigoSede,
        ciudad: trimOrNull(raw.ciudad) ?? '',
        countryId: country.id,
        direccion: trimOrNull(raw.direccion),
        aforoMaximo: typeof raw.aforoMaximo === 'number' ? raw.aforoMaximo : null,
        activa: String(raw.activa ?? '').trim().toUpperCase() !== 'NO',
      },
    });
  }
}

async function seedDocumentTypes(prisma: PrismaClient): Promise<void> {
  for (const isoCode of ['CO', 'PA'] as const) {
    const country = await prisma.country.upsert({
      where: { isoCode },
      update: {},
      create: { isoCode, nombre: NOMBRE_PAIS[isoCode] },
    });
    for (const tipo of CATALOGO_TIPOS_DOC[isoCode]) {
      await prisma.documentType.upsert({
        where: { countryId_codigo: { countryId: country.id, codigo: tipo.codigo } },
        update: { nombre: tipo.nombre, patronValidacion: tipo.patron },
        create: {
          countryId: country.id,
          codigo: tipo.codigo,
          nombre: tipo.nombre,
          patronValidacion: tipo.patron,
        },
      });
    }
  }
}

// ---------------------------------------------------------------------------
// Normalización + validación por fila
// ---------------------------------------------------------------------------

interface Contexto {
  countryByIso: Map<string, { id: number }>;
  docTypeByKey: Map<string, { id: number }>;
  siteCodes: ReadonlySet<string>;
}

export interface FilaAceptada {
  tipo: 'ACEPTADA';
  fila: number;
  codigoEmpleado: string;
  advertencias: string[];
  documentTypeId: number;
  numeroOriginal: string;
  numeroNormalizado: string;
  siteCode: string | null;
  employeeData: {
    codigoEmpleado: string;
    primerNombre: string;
    segundoNombre: string | null;
    primerApellido: string;
    segundoApellido: string | null;
    countryIso: 'CO' | 'PA';
    area: string | null;
    cargo: string | null;
    email: string | null;
    telefono: string | null;
    fechaIngreso: Date | null;
    fechaRetiro: Date | null;
    estado: 'ACTIVO' | 'INACTIVO';
    jornada: string | null;
    biostarUserId: string | null;
    tarjetaRfid: string | null;
    nivelAcceso: string | null;
  };
  /** Cuenta de campos "opcionales" presentes; sirve para elegir el registro más completo
   *  cuando dos filas comparten (documentTypeId, numeroNormalizado) (RF-09, P-03). */
  completitud: number;
}

interface FilaRechazada {
  tipo: 'RECHAZADA';
  fila: number;
  codigoEmpleado: string | null;
  motivo: string;
}

type FilaNormalizada = FilaAceptada | FilaRechazada;

function normalizeEmployeeRow(raw: RawEmployeeRow, ctx: Contexto): FilaNormalizada {
  const codigoEmpleado = trimOrNull(raw.codigoEmpleado);
  const primerNombre = trimOrNull(raw.primerNombre);
  const primerApellido = trimOrNull(raw.primerApellido);
  const countryIso = normalizePais(raw.pais);
  const tipoDocCodigo = normalizeTipoDoc(raw.tipoDoc, countryIso);
  const numeroNormalizado = normalizeNumeroDocumento(raw.numeroDocumento);

  // Campos estructuralmente obligatorios: sin ellos no hay fila de Employee válida
  // (codigo_empleado/primer_nombre/primer_apellido son NOT NULL en el modelo) o no se
  // puede resolver la identidad por país/tipo/número (RF-02, RF-03, RF-10).
  const faltantes: string[] = [];
  if (!codigoEmpleado) faltantes.push('codigo_empleado');
  if (!primerNombre) faltantes.push('primer_nombre');
  if (!primerApellido) faltantes.push('primer_apellido');
  if (!countryIso) faltantes.push('pais');
  if (!numeroNormalizado) faltantes.push('numero_documento');
  if (!tipoDocCodigo) faltantes.push('tipo_doc');

  if (faltantes.length > 0) {
    return {
      tipo: 'RECHAZADA',
      fila: raw.fila,
      codigoEmpleado,
      motivo: `Falta(n) campo(s) crítico(s): ${faltantes.join(', ')}`,
    };
  }

  const country = ctx.countryByIso.get(countryIso!)!;
  const docType = ctx.docTypeByKey.get(`${country.id}:${tipoDocCodigo}`);
  if (!docType) {
    return {
      tipo: 'RECHAZADA',
      fila: raw.fila,
      codigoEmpleado,
      motivo: `tipo_doc "${raw.tipoDoc}" no es válido para ${NOMBRE_PAIS[countryIso!]}`,
    };
  }

  const advertencias: string[] = [];
  const email = trimOrNull(raw.email);
  if (!email) advertencias.push('Sin email');
  const telefono = trimOrNull(raw.telefono);
  if (!telefono) advertencias.push('Sin teléfono');
  const idBiostar = trimOrNull(raw.idBiostar);
  if (!idBiostar) advertencias.push('Sin id_biostar');

  const sedeResolucion = normalizeSede(raw.sede, ctx.siteCodes);
  if (sedeResolucion.advertencia) advertencias.push(sedeResolucion.advertencia);

  const area = trimOrNull(raw.area);
  const cargo = trimOrNull(raw.cargo);
  const jornada = normalizeJornada(raw.jornada);
  const tarjetaRfid = trimOrNull(raw.tarjetaRfid);
  const nivelAcceso = trimOrNull(raw.nivelAcceso);
  const fechaIngreso = normalizeFecha(raw.fechaIngreso);
  const fechaRetiro = normalizeFecha(raw.fechaRetiro);
  const estado = normalizeEstado(raw.estado) ?? 'ACTIVO';

  const completitud = [
    email, telefono, idBiostar, sedeResolucion.codigoSede, area, cargo,
    jornada, tarjetaRfid, nivelAcceso, fechaIngreso,
  ].filter((v) => v !== null && v !== undefined).length;

  return {
    tipo: 'ACEPTADA',
    fila: raw.fila,
    codigoEmpleado: codigoEmpleado!,
    advertencias,
    documentTypeId: docType.id,
    numeroOriginal: trimOrNull(raw.numeroDocumento)!,
    numeroNormalizado: numeroNormalizado!,
    siteCode: sedeResolucion.codigoSede,
    employeeData: {
      codigoEmpleado: codigoEmpleado!,
      primerNombre: primerNombre!,
      segundoNombre: trimOrNull(raw.segundoNombre),
      primerApellido: primerApellido!,
      segundoApellido: trimOrNull(raw.segundoApellido),
      countryIso: countryIso!,
      area,
      cargo,
      email,
      telefono,
      fechaIngreso,
      fechaRetiro,
      estado,
      jornada,
      biostarUserId: idBiostar,
      tarjetaRfid,
      nivelAcceso,
    },
    completitud,
  };
}

/**
 * RF-09: cuando dos filas ACEPTADAS comparten (documentTypeId, numeroNormalizado) pero
 * tienen codigo_empleado distinto, es la misma persona recreada (reingreso o traslado
 * mal registrado). La restricción única de EmployeeDocument impide guardar el documento
 * dos veces, así que se elige un "ganador" (el más completo; empate -> fila más
 * temprana) que se queda con el documento; el resto se carga igual como empleado pero
 * sin documento propio, marcado con advertencia para revisión humana (ver REQUISITOS.md
 * P-03: "los marco para revisión y cargo el más completo, sin perder el otro").
 */
export function elegirGanadoresDeDuplicados(filas: FilaAceptada[]): Map<number, FilaAceptada> {
  const porClave = new Map<string, FilaAceptada[]>();
  for (const f of filas) {
    const clave = `${f.documentTypeId}:${f.numeroNormalizado}`;
    const grupo = porClave.get(clave) ?? [];
    grupo.push(f);
    porClave.set(clave, grupo);
  }

  const ganadorPorFila = new Map<number, FilaAceptada>();
  for (const grupo of porClave.values()) {
    const distintos = new Set(grupo.map((f) => f.codigoEmpleado));
    if (distintos.size <= 1) {
      for (const f of grupo) ganadorPorFila.set(f.fila, f);
      continue;
    }
    const ganador = [...grupo].sort((a, b) => b.completitud - a.completitud || a.fila - b.fila)[0];
    ganadorPorFila.set(ganador.fila, ganador);
  }
  return ganadorPorFila;
}

// ---------------------------------------------------------------------------
// Persistencia
// ---------------------------------------------------------------------------

async function persistirFilaAceptada(
  prisma: PrismaClient,
  batchId: number,
  fila: FilaAceptada,
  esGanadora: boolean,
  countryIdByIso: Map<string, number>,
): Promise<RowResultDto> {
  const advertencias = [...fila.advertencias];

  const employee = await prisma.employee.upsert({
    where: { codigoEmpleado: fila.employeeData.codigoEmpleado },
    update: {
      primerNombre: fila.employeeData.primerNombre,
      segundoNombre: fila.employeeData.segundoNombre,
      primerApellido: fila.employeeData.primerApellido,
      segundoApellido: fila.employeeData.segundoApellido,
      countryId: countryIdByIso.get(fila.employeeData.countryIso)!,
      area: fila.employeeData.area,
      cargo: fila.employeeData.cargo,
      email: fila.employeeData.email,
      telefono: fila.employeeData.telefono,
      fechaIngreso: fila.employeeData.fechaIngreso,
      fechaRetiro: fila.employeeData.fechaRetiro,
      estado: fila.employeeData.estado,
      jornada: fila.employeeData.jornada,
      biostarUserId: fila.employeeData.biostarUserId,
      tarjetaRfid: fila.employeeData.tarjetaRfid,
      nivelAcceso: fila.employeeData.nivelAcceso,
    },
    create: {
      codigoEmpleado: fila.employeeData.codigoEmpleado,
      primerNombre: fila.employeeData.primerNombre,
      segundoNombre: fila.employeeData.segundoNombre,
      primerApellido: fila.employeeData.primerApellido,
      segundoApellido: fila.employeeData.segundoApellido,
      countryId: countryIdByIso.get(fila.employeeData.countryIso)!,
      area: fila.employeeData.area,
      cargo: fila.employeeData.cargo,
      email: fila.employeeData.email,
      telefono: fila.employeeData.telefono,
      fechaIngreso: fila.employeeData.fechaIngreso,
      fechaRetiro: fila.employeeData.fechaRetiro,
      estado: fila.employeeData.estado,
      jornada: fila.employeeData.jornada,
      biostarUserId: fila.employeeData.biostarUserId,
      tarjetaRfid: fila.employeeData.tarjetaRfid,
      nivelAcceso: fila.employeeData.nivelAcceso,
    },
  });

  if (esGanadora) {
    await prisma.employeeDocument.upsert({
      where: {
        documentTypeId_numeroNormalizado: {
          documentTypeId: fila.documentTypeId,
          numeroNormalizado: fila.numeroNormalizado,
        },
      },
      update: { employeeId: employee.id, numeroOriginal: fila.numeroOriginal },
      create: {
        employeeId: employee.id,
        documentTypeId: fila.documentTypeId,
        numeroOriginal: fila.numeroOriginal,
        numeroNormalizado: fila.numeroNormalizado,
        esPrincipal: true,
      },
    });
  } else {
    advertencias.push(
      `Documento duplicado (mismo tipo y número que otro empleado ya cargado); no se vinculó el documento, requiere revisión manual (RF-09)`,
    );
  }

  if (fila.siteCode) {
    const site = await prisma.site.findUnique({ where: { codigoSede: fila.siteCode } });
    if (site) {
      await prisma.employeeSite.upsert({
        where: { employeeId_siteId: { employeeId: employee.id, siteId: site.id } },
        update: { esSedePrincipal: true },
        create: { employeeId: employee.id, siteId: site.id, esSedePrincipal: true },
      });
    }
  }

  const estado: RowEstado = advertencias.length > 0 ? 'ADVERTENCIA' : 'OK';
  const motivo = advertencias.length > 0 ? advertencias.join('; ') : null;

  const rowResult = await prisma.ingestionRowResult.create({
    data: {
      batchId,
      numeroFila: fila.fila,
      estado,
      motivo,
      employeeId: employee.id,
    },
  });

  return {
    fila: rowResult.numeroFila,
    estado: rowResult.estado as RowEstado,
    motivo: rowResult.motivo,
    codigoEmpleado: fila.employeeData.codigoEmpleado,
    employeeId: employee.id,
  };
}

async function persistirFilaRechazada(
  prisma: PrismaClient,
  batchId: number,
  fila: FilaRechazada,
): Promise<RowResultDto> {
  const rowResult = await prisma.ingestionRowResult.create({
    data: {
      batchId,
      numeroFila: fila.fila,
      estado: 'RECHAZADO',
      motivo: fila.motivo,
      employeeId: null,
    },
  });
  return {
    fila: rowResult.numeroFila,
    estado: 'RECHAZADO',
    motivo: rowResult.motivo,
    codigoEmpleado: fila.codigoEmpleado,
    employeeId: null,
  };
}

// ---------------------------------------------------------------------------
// Orquestación
// ---------------------------------------------------------------------------

export async function runIngestion(
  prisma: PrismaClient,
  buffer: Buffer,
  nombreArchivo: string,
): Promise<IngestionSummary> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer as unknown as ExcelJS.Buffer);

  const sedesSheet = workbook.getWorksheet('Sedes');
  const empleadosSheet = workbook.getWorksheet('Empleados');
  if (!sedesSheet || !empleadosSheet) {
    throw new Error('El Excel debe contener las hojas "Sedes" y "Empleados"');
  }

  await seedSitesAndCountries(prisma, readSiteRows(sedesSheet));
  await seedDocumentTypes(prisma);

  const countries = await prisma.country.findMany();
  const countryByIso = new Map(countries.map((c) => [c.isoCode, c]));
  const countryIdByIso = new Map(countries.map((c) => [c.isoCode, c.id]));
  const docTypes = await prisma.documentType.findMany();
  const docTypeByKey = new Map(docTypes.map((d) => [`${d.countryId}:${d.codigo}`, d]));
  const sites = await prisma.site.findMany({ select: { codigoSede: true } });
  const siteCodes = new Set(sites.map((s) => s.codigoSede));

  const ctx: Contexto = { countryByIso, docTypeByKey, siteCodes };

  const rawRows = readEmployeeRows(empleadosSheet);
  const normalizadas = rawRows.map((r) => normalizeEmployeeRow(r, ctx));

  const aceptadas = normalizadas.filter((f): f is FilaAceptada => f.tipo === 'ACEPTADA');
  const ganadores = elegirGanadoresDeDuplicados(aceptadas);

  const batch = await prisma.ingestionBatch.create({
    data: { nombreArchivo, totalFilas: rawRows.length, filasOk: 0, filasRechazadas: 0 },
  });

  const filas: RowResultDto[] = [];
  for (const f of normalizadas) {
    if (f.tipo === 'RECHAZADA') {
      filas.push(await persistirFilaRechazada(prisma, batch.id, f));
    } else {
      const esGanadora = ganadores.get(f.fila) === f;
      filas.push(await persistirFilaAceptada(prisma, batch.id, f, esGanadora, countryIdByIso));
    }
  }

  const filasOk = filas.filter((f) => f.estado === 'OK').length;
  const filasAdvertencia = filas.filter((f) => f.estado === 'ADVERTENCIA').length;
  const filasRechazadas = filas.filter((f) => f.estado === 'RECHAZADO').length;

  await prisma.ingestionBatch.update({
    where: { id: batch.id },
    data: { filasOk, filasRechazadas },
  });

  return {
    batchId: batch.id,
    nombreArchivo,
    ejecutadoEn: batch.ejecutadoEn,
    totalFilas: rawRows.length,
    filasOk,
    filasAdvertencia,
    filasRechazadas,
    filas,
  };
}
