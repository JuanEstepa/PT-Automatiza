/**
 * Tests de la resolución de duplicados de identidad (RF-09). Casos modelados sobre los
 * duplicados reales del archivo (mismo documento, codigo_empleado distinto): números
 * 52447891 y 79458122 (ver MODELO-DATOS.md §4).
 */
import { elegirGanadoresDeDuplicados, type FilaAceptada } from './ingestion.core';

function filaAceptada(overrides: Partial<FilaAceptada>): FilaAceptada {
  return {
    tipo: 'ACEPTADA',
    fila: 1,
    codigoEmpleado: '1000',
    advertencias: [],
    documentTypeId: 1,
    numeroOriginal: '52447891',
    numeroNormalizado: '52447891',
    siteCode: 'BOG-TOR',
    employeeData: {
      codigoEmpleado: '1000',
      primerNombre: 'Test',
      segundoNombre: null,
      primerApellido: 'Empleado',
      segundoApellido: null,
      countryIso: 'CO',
      area: null,
      cargo: null,
      email: null,
      telefono: null,
      fechaIngreso: null,
      fechaRetiro: null,
      estado: 'ACTIVO',
      jornada: null,
      biostarUserId: null,
      tarjetaRfid: null,
      nivelAcceso: null,
    },
    completitud: 0,
    ...overrides,
  };
}

describe('elegirGanadoresDeDuplicados', () => {
  it('no marca nada cuando cada documento pertenece a un único codigo_empleado', () => {
    const filas = [
      filaAceptada({ fila: 1, codigoEmpleado: '1143', numeroNormalizado: '111' }),
      filaAceptada({ fila: 2, codigoEmpleado: '1144', numeroNormalizado: '222' }),
    ];
    const ganadores = elegirGanadoresDeDuplicados(filas);
    expect(ganadores.get(1)).toBe(filas[0]);
    expect(ganadores.get(2)).toBe(filas[1]);
  });

  it('no considera duplicado el mismo número si el tipo de documento (país) es distinto', () => {
    // Caso real: '8-123-456' aparece como CE-Colombia (empleado 1105) y CIP-Panamá (1106).
    // documentTypeId ya viene resuelto por país, así que sus claves no colisionan.
    const filas = [
      filaAceptada({ fila: 19, codigoEmpleado: '1105', documentTypeId: 2, numeroNormalizado: '8-123-456' }),
      filaAceptada({ fila: 122, codigoEmpleado: '1106', documentTypeId: 5, numeroNormalizado: '8-123-456' }),
    ];
    const ganadores = elegirGanadoresDeDuplicados(filas);
    expect(ganadores.get(19)).toBe(filas[0]);
    expect(ganadores.get(122)).toBe(filas[1]);
  });

  it('cuando dos codigo_empleado distintos comparten (tipo, número), elige el más completo como ganador', () => {
    // Caso real: numero 52447891, empleados 1143 (fila 98) y 1144 (fila 18).
    const menosCompleta = filaAceptada({ fila: 18, codigoEmpleado: '1144', completitud: 3 });
    const masCompleta = filaAceptada({ fila: 98, codigoEmpleado: '1143', completitud: 7 });
    const ganadores = elegirGanadoresDeDuplicados([menosCompleta, masCompleta]);

    expect(ganadores.get(98)).toBe(masCompleta);
    expect(ganadores.has(18)).toBe(false);
  });

  it('en caso de empate en completitud, gana la fila con menor número (la primera del archivo)', () => {
    const primera = filaAceptada({ fila: 18, codigoEmpleado: '1144', completitud: 5 });
    const segunda = filaAceptada({ fila: 98, codigoEmpleado: '1143', completitud: 5 });
    const ganadores = elegirGanadoresDeDuplicados([segunda, primera]);

    expect(ganadores.get(18)).toBe(primera);
    expect(ganadores.has(98)).toBe(false);
  });
});
