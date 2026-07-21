export type RowEstado = 'OK' | 'ADVERTENCIA' | 'RECHAZADO';

export interface RowResultDto {
  fila: number;
  estado: RowEstado;
  motivo: string | null;
  codigoEmpleado: string | null;
  employeeId: number | null;
}

export interface IngestionSummary {
  batchId: number;
  nombreArchivo: string;
  ejecutadoEn: Date;
  totalFilas: number;
  filasOk: number;
  filasAdvertencia: number;
  filasRechazadas: number;
  filas: RowResultDto[];
}

/** Fila cruda leída del Excel, columnas mapeadas por nombre de encabezado. */
export interface RawEmployeeRow {
  fila: number;
  codigoEmpleado: unknown;
  primerNombre: unknown;
  segundoNombre: unknown;
  primerApellido: unknown;
  segundoApellido: unknown;
  tipoDoc: unknown;
  numeroDocumento: unknown;
  pais: unknown;
  sede: unknown;
  area: unknown;
  cargo: unknown;
  // centro_costo y tipo_contrato se leen implícitamente por posición pero NUNCA se
  // mapean a un campo de salida: RF-12 prohíbe cargarlos al modelo núcleo.
  fechaIngreso: unknown;
  fechaRetiro: unknown;
  estado: unknown;
  email: unknown;
  telefono: unknown;
  idBiostar: unknown;
  tarjetaRfid: unknown;
  nivelAcceso: unknown;
  jornada: unknown;
}

export interface RawSiteRow {
  codigoSede: unknown;
  nombreSede: unknown;
  ciudad: unknown;
  pais: unknown;
  direccion: unknown;
  aforoMaximo: unknown;
  activa: unknown;
}
