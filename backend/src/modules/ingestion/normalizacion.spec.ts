/**
 * Tests de los normalizadores de ingesta (RF-08). Casos tomados directamente del
 * archivo real 03-empleados-banco-andino.xlsx (ver MODELO-DATOS.md §4).
 */
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

describe('trimOrNull', () => {
  it('recorta espacios y devuelve null para vacío/undefined/null', () => {
    expect(trimOrNull('  hola  ')).toBe('hola');
    expect(trimOrNull('')).toBeNull();
    expect(trimOrNull('   ')).toBeNull();
    expect(trimOrNull(null)).toBeNull();
    expect(trimOrNull(undefined)).toBeNull();
  });
});

describe('normalizePais', () => {
  it('normaliza las 5 variantes reales del archivo a CO/PA', () => {
    expect(normalizePais('Colombia')).toBe('CO');
    expect(normalizePais('Panamá')).toBe('PA');
    expect(normalizePais('PA')).toBe('PA');
    expect(normalizePais('PANAMA')).toBe('PA');
    expect(normalizePais('Panama')).toBe('PA');
  });

  it('devuelve null si falta o no se reconoce', () => {
    expect(normalizePais(null)).toBeNull();
    expect(normalizePais(undefined)).toBeNull();
    expect(normalizePais('Ecuador')).toBeNull();
  });
});

describe('normalizeTipoDoc', () => {
  it('devuelve el código tal cual en mayúsculas para los tipos estándar', () => {
    expect(normalizeTipoDoc('CC', 'CO')).toBe('CC');
    expect(normalizeTipoDoc('cip', 'PA')).toBe('CIP');
    expect(normalizeTipoDoc('ce', 'CO')).toBe('CE');
    expect(normalizeTipoDoc('N', 'PA')).toBe('N');
  });

  it('mapea el alias "PA" (columna tipo_doc) a pasaporte solo para Colombia', () => {
    // Caso real: codigo_empleado 1037, tipo_doc='PA', pais='Colombia', numero='D578255'
    expect(normalizeTipoDoc('PA', 'CO')).toBe('PAS');
  });

  it('devuelve null si el valor falta', () => {
    expect(normalizeTipoDoc(null, 'CO')).toBeNull();
    expect(normalizeTipoDoc(undefined, 'PA')).toBeNull();
  });
});

describe('normalizeEstado', () => {
  it('normaliza las variantes reales a ACTIVO/INACTIVO', () => {
    expect(normalizeEstado('Activo')).toBe('ACTIVO');
    expect(normalizeEstado('ACTIVO')).toBe('ACTIVO');
    expect(normalizeEstado('A')).toBe('ACTIVO');
    expect(normalizeEstado('Inactivo')).toBe('INACTIVO');
    expect(normalizeEstado('Retirado')).toBe('INACTIVO');
  });

  it('devuelve null si falta o no se reconoce', () => {
    expect(normalizeEstado(null)).toBeNull();
    expect(normalizeEstado('Suspendido')).toBeNull();
  });
});

describe('normalizeJornada', () => {
  it('normaliza Diurna/Nocturna/Mixta y trata N/A como ausente', () => {
    expect(normalizeJornada('Diurna')).toBe('DIURNA');
    expect(normalizeJornada('Nocturna')).toBe('NOCTURNA');
    expect(normalizeJornada('Mixta')).toBe('MIXTA');
    expect(normalizeJornada('N/A')).toBeNull();
    expect(normalizeJornada(null)).toBeNull();
  });
});

describe('normalizeFecha', () => {
  it('pasa un Date real (celda de fecha de Excel) sin tocarlo', () => {
    const d = new Date(Date.UTC(2021, 4, 12));
    expect(normalizeFecha(d)).toBe(d);
  });

  it('parsea formato ISO yyyy-mm-dd', () => {
    expect(normalizeFecha('2022-11-03')).toEqual(new Date(Date.UTC(2022, 10, 3)));
  });

  it('parsea formato dd/mm/yyyy', () => {
    expect(normalizeFecha('15/03/2022')).toEqual(new Date(Date.UTC(2022, 2, 15)));
  });

  it('parsea fecha en texto en español', () => {
    expect(normalizeFecha('3 de abril de 2021')).toEqual(new Date(Date.UTC(2021, 3, 3)));
  });

  it('devuelve null para vacío o texto no reconocible', () => {
    expect(normalizeFecha(null)).toBeNull();
    expect(normalizeFecha('')).toBeNull();
    expect(normalizeFecha('fecha inválida')).toBeNull();
  });
});

describe('normalizeNumeroDocumento', () => {
  it('quita puntos usados como separador de miles', () => {
    expect(normalizeNumeroDocumento('1.020.304.050')).toBe('1020304050');
  });

  it('expande notación científica de Excel', () => {
    expect(normalizeNumeroDocumento('1.02E+09')).toBe('1020000000');
  });

  it('recorta espacios sobrantes', () => {
    expect(normalizeNumeroDocumento('  52889147  ')).toBe('52889147');
  });

  it('conserva guiones de los formatos panameños', () => {
    expect(normalizeNumeroDocumento('8-123-456')).toBe('8-123-456');
    expect(normalizeNumeroDocumento('N-14-536-826')).toBe('N-14-536-826');
  });

  it('conserva prefijos de letra de pasaportes', () => {
    expect(normalizeNumeroDocumento('C414576')).toBe('C414576');
  });

  it('devuelve null si falta', () => {
    expect(normalizeNumeroDocumento(null)).toBeNull();
    expect(normalizeNumeroDocumento('')).toBeNull();
  });
});

describe('normalizeSede', () => {
  const catalogo = new Set(['BOG-TOR', 'BOG-CD', 'MED-01', 'CAL-01', 'PTY-01', 'CHI-01']);

  it('acepta un código de sede que ya está en el catálogo', () => {
    expect(normalizeSede('BOG-TOR', catalogo)).toEqual({ codigoSede: 'BOG-TOR' });
  });

  it('marca BAQ-01 como sede fantasma para revisión, sin rechazar la fila', () => {
    const r = normalizeSede('BAQ-01', catalogo);
    expect(r.codigoSede).toBeNull();
    expect(r.advertencia).toMatch(/fantasma/i);
  });

  it('marca "Bogotá D.C." como ambigua (Torre vs Centro de Datos)', () => {
    const r = normalizeSede('Bogotá D.C.', catalogo);
    expect(r.codigoSede).toBeNull();
    expect(r.advertencia).toMatch(/ambigua/i);
  });

  it('marca "BOGOTA" (sin código) como ambigua también', () => {
    const r = normalizeSede('BOGOTA', catalogo);
    expect(r.codigoSede).toBeNull();
    expect(r.advertencia).toMatch(/ambigua/i);
  });

  it('marca sede vacía como advertencia sin rechazar', () => {
    const r = normalizeSede(null, catalogo);
    expect(r.codigoSede).toBeNull();
    expect(r.advertencia).toMatch(/sin sede/i);
  });

  it('marca cualquier otro valor desconocido para revisión', () => {
    const r = normalizeSede('SEDE-INVENTADA', catalogo);
    expect(r.codigoSede).toBeNull();
    expect(r.advertencia).toMatch(/no reconocida/i);
  });
});
