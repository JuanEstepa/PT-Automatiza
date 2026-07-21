/**
 * Normalizadores puros de la ingesta (RF-08). Sin dependencias de NestJS ni de Prisma
 * para que sean triviales de testear de forma aislada (ver normalizacion.spec.ts).
 */

function quitarTildes(s: string): string {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

export function trimOrNull(v: unknown): string | null {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  return s === '' ? null : s;
}

/** 'Colombia' / 'COLOMBIA' / 'Panamá' / 'PA' / 'Panama' -> 'CO' | 'PA' */
export function normalizePais(raw: unknown): 'CO' | 'PA' | null {
  const v = trimOrNull(raw);
  if (!v) return null;
  const norm = quitarTildes(v).trim().toLowerCase();
  if (norm === 'colombia' || norm === 'co') return 'CO';
  if (norm === 'panama' || norm === 'pa') return 'PA';
  return null;
}

/**
 * Código de tipo de documento tal como viene en el archivo, con el único alias real
 * observado en los datos: 'PA' en la columna tipo_doc (no país) es pasaporte mal
 * escrito para un empleado colombiano (ver MODELO-DATOS.md §4: "PAS/PA, escrito de
 * 2 formas"). El resto de códigos se devuelven en mayúsculas tal cual; la validez
 * contra el catálogo por país la resuelve el llamador (ingestion.core.ts).
 */
export function normalizeTipoDoc(raw: unknown, paisIso: 'CO' | 'PA' | null): string | null {
  const v = trimOrNull(raw);
  if (!v) return null;
  const norm = v.toUpperCase();
  if (norm === 'PA' && paisIso === 'CO') return 'PAS';
  return norm;
}

/** 'Activo' / 'ACTIVO' / 'A' -> 'ACTIVO'; 'Inactivo' / 'Retirado' -> 'INACTIVO' */
export function normalizeEstado(raw: unknown): 'ACTIVO' | 'INACTIVO' | null {
  const v = trimOrNull(raw);
  if (!v) return null;
  const norm = quitarTildes(v).toLowerCase();
  if (norm === 'activo' || norm === 'a') return 'ACTIVO';
  if (norm === 'inactivo' || norm === 'retirado') return 'INACTIVO';
  return null;
}

/** 'Diurna' / 'Nocturna' / 'Mixta' -> catálogo; 'N/A' o vacío -> null */
export function normalizeJornada(raw: unknown): 'DIURNA' | 'NOCTURNA' | 'MIXTA' | null {
  const v = trimOrNull(raw);
  if (!v) return null;
  const norm = quitarTildes(v).toLowerCase();
  if (norm === 'n/a') return null;
  if (norm === 'diurna') return 'DIURNA';
  if (norm === 'nocturna') return 'NOCTURNA';
  if (norm === 'mixta') return 'MIXTA';
  return null;
}

const MESES_ES: Record<string, number> = {
  enero: 0, febrero: 1, marzo: 2, abril: 3, mayo: 4, junio: 5,
  julio: 6, agosto: 7, septiembre: 8, octubre: 9, noviembre: 10, diciembre: 11,
};

/**
 * Soporta fechas ya parseadas por exceljs (Date real de una celda de tipo fecha) y los
 * tres formatos de texto detectados en el archivo real: '2022-11-03', '15/03/2022' y
 * '3 de abril de 2021' (ver MODELO-DATOS.md §4).
 */
export function normalizeFecha(raw: unknown): Date | null {
  if (raw === null || raw === undefined || raw === '') return null;
  if (raw instanceof Date) return raw;

  const s = String(raw).trim();

  let m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (m) return new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));

  m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (m) return new Date(Date.UTC(+m[3], +m[2] - 1, +m[1]));

  m = quitarTildes(s).toLowerCase().match(/^(\d{1,2}) de ([a-z]+) de (\d{4})$/);
  if (m && MESES_ES[m[2]] !== undefined) {
    return new Date(Date.UTC(+m[3], MESES_ES[m[2]], +m[1]));
  }

  return null;
}

/**
 * Limpia número de documento: quita espacios y puntos usados como separador de miles
 * ('1.020.304.050' -> '1020304050'), y expande notación científica de Excel
 * ('1.02E+09' -> '1020000000'). Los formatos con guiones (Panamá) o letras (pasaportes)
 * se conservan tal cual una vez recortados, porque la validación de patrón por tipo de
 * documento es metadata (document_type.patron_validacion) y no bloquea la carga en el MVP.
 */
export function normalizeNumeroDocumento(raw: unknown): string | null {
  const v = trimOrNull(raw);
  if (!v) return null;

  if (/e\+\d+$/i.test(v)) {
    const n = Number(v);
    if (!Number.isNaN(n)) return Math.round(n).toString();
  }

  const sinPuntos = v.replace(/\./g, '');
  if (/^\d+$/.test(sinPuntos)) return sinPuntos;

  return v;
}

export interface ResolucionSede {
  codigoSede: string | null;
  advertencia?: string;
}

/**
 * Resuelve la sede contra el catálogo cargado en BD. Casos especiales documentados en
 * MODELO-DATOS.md §4 y ALCANCE.md: 'BAQ-01' es una sede fantasma (no existe en el
 * catálogo de 6 sedes) y 'Bogotá'/'Bogotá D.C.' es ambigua entre Torre Bogotá y Centro
 * de Datos Bogotá. Ambos casos NO rechazan la fila: se cargan sin vínculo de sede y se
 * marcan con advertencia para revisión de Talento Humano (ver REQUISITOS.md §3, nueva
 * nota sobre criticidad de 'sede').
 */
export function normalizeSede(raw: unknown, catalogoCodigos: ReadonlySet<string>): ResolucionSede {
  const v = trimOrNull(raw);
  if (!v) return { codigoSede: null, advertencia: 'Sin sede asignada' };

  if (catalogoCodigos.has(v)) return { codigoSede: v };

  const norm = quitarTildes(v).toUpperCase().replace(/\s+/g, ' ').trim();
  if (norm === 'BAQ-01') {
    return {
      codigoSede: null,
      advertencia: `Sede "${v}" no existe en el catálogo de 6 sedes (sede fantasma); requiere revisión manual`,
    };
  }
  if (norm === 'BOGOTA' || norm === 'BOGOTA D.C.' || norm === 'BOGOTA DC') {
    return {
      codigoSede: null,
      advertencia: `Sede "${v}" es ambigua (no distingue Torre Bogotá de Centro de Datos Bogotá); requiere revisión manual`,
    };
  }
  return { codigoSede: null, advertencia: `Sede "${v}" no reconocida; requiere revisión manual` };
}
