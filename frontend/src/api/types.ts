export interface Country {
  id: number;
  isoCode: string;
  nombre: string;
}

export interface Site {
  id: number;
  codigoSede: string;
  nombre: string;
  ciudad: string;
  direccion: string | null;
  aforoMaximo: number | null;
  activa: boolean;
  country?: Country;
}

export interface EmployeeDocument {
  numeroNormalizado: string;
  documentType: { codigo: string; nombre: string };
}

export interface EmployeeSiteLink {
  esSedePrincipal: boolean;
  site: { id: number; codigoSede: string; nombre: string };
}

export interface Employee {
  id: number;
  codigoEmpleado: string;
  primerNombre: string;
  segundoNombre: string | null;
  primerApellido: string;
  segundoApellido: string | null;
  estado: 'ACTIVO' | 'INACTIVO';
  email: string | null;
  telefono: string | null;
  area: string | null;
  cargo: string | null;
  jornada: string | null;
  country: Country;
  documents: EmployeeDocument[];
  sites: EmployeeSiteLink[];
}

export interface OccupancySite {
  siteId: number;
  codigoSede: string;
  nombre: string;
  ciudad: string;
  aforoMaximo: number | null;
  ocupacionActual: number;
  porcentaje: number | null;
}

export interface OccupancyDetailEmployee {
  id: number;
  codigoEmpleado: string;
  primerNombre: string;
  primerApellido: string;
  area: string | null;
  cargo: string | null;
  ingresadoDesde: string;
}

export interface AuditRow {
  fecha: string;
  direccion: 'IN' | 'OUT';
  codigoEmpleado: string;
  empleado: string;
  sede: string;
  dispositivo: string;
  fuente: string;
}

export type RowEstado = 'OK' | 'ADVERTENCIA' | 'RECHAZADO';

export interface IngestionRowResult {
  fila: number;
  estado: RowEstado;
  motivo: string | null;
  codigoEmpleado: string | null;
  employeeId: number | null;
}

export interface IngestionSummary {
  batchId: number;
  nombreArchivo: string;
  ejecutadoEn: string;
  totalFilas: number;
  filasOk: number;
  filasAdvertencia: number;
  filasRechazadas: number;
  filas: IngestionRowResult[];
}

