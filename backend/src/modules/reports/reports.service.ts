import { Injectable } from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import { PrismaService } from '../../common/prisma.service';

export interface AuditoriaFiltros {
  desde?: Date;
  hasta?: Date;
  siteId?: number;
}

interface FilaAuditoria {
  fecha: Date;
  direccion: string;
  codigoEmpleado: string;
  empleado: string;
  sede: string;
  dispositivo: string;
  fuente: string;
}

const COLUMNAS: Array<{ header: string; key: keyof FilaAuditoria; width: number }> = [
  { header: 'Fecha y hora', key: 'fecha', width: 22 },
  { header: 'Dirección', key: 'direccion', width: 12 },
  { header: 'Código empleado', key: 'codigoEmpleado', width: 16 },
  { header: 'Empleado', key: 'empleado', width: 30 },
  { header: 'Sede', key: 'sede', width: 26 },
  { header: 'Dispositivo', key: 'dispositivo', width: 26 },
  { header: 'Fuente', key: 'fuente', width: 14 },
];

/**
 * Reporte de auditoría filtrable por rango de fechas y sede (RF-16), con exportación a
 * Excel/CSV (RF-17): "acá toda la operación se maneja en Excel". Se apoya en
 * AccessEvent, la misma fuente que usa `occupancy` para el aforo (MODELO-DATOS.md §1.5).
 */
@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async audit(filtros: AuditoriaFiltros = {}) {
    const eventos = await this.prisma.accessEvent.findMany({
      where: {
        siteId: filtros.siteId,
        ocurridoEn: {
          gte: filtros.desde,
          lte: filtros.hasta,
        },
      },
      include: { employee: true, site: true, device: true },
      orderBy: { ocurridoEn: 'desc' },
    });

    return eventos.map((e) => this.aFilaAuditoria(e));
  }

  private aFilaAuditoria(e: {
    ocurridoEn: Date;
    direccion: string;
    employee: { codigoEmpleado: string; primerNombre: string; primerApellido: string } | null;
    site: { nombre: string };
    device: { nombre: string } | null;
    fuente: string;
  }): FilaAuditoria {
    return {
      fecha: e.ocurridoEn,
      direccion: e.direccion,
      codigoEmpleado: e.employee?.codigoEmpleado ?? '(no identificado)',
      empleado: e.employee ? `${e.employee.primerNombre} ${e.employee.primerApellido}` : '(no identificado)',
      sede: e.site.nombre,
      dispositivo: e.device?.nombre ?? '—',
      fuente: e.fuente,
    };
  }

  /** RF-17: exportación a Excel del mismo reporte que se ve en pantalla. */
  async exportarExcel(filtros: AuditoriaFiltros = {}): Promise<Buffer> {
    const filas = await this.audit(filtros);

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Auditoría');
    sheet.columns = COLUMNAS;
    sheet.getRow(1).font = { bold: true };
    for (const fila of filas) sheet.addRow(fila);

    return (await workbook.xlsx.writeBuffer()) as unknown as Buffer;
  }

  /** RF-17: exportación a CSV del mismo reporte que se ve en pantalla. */
  async exportarCsv(filtros: AuditoriaFiltros = {}): Promise<Buffer> {
    const filas = await this.audit(filtros);

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Auditoría');
    sheet.columns = COLUMNAS;
    for (const fila of filas) sheet.addRow(fila);

    return (await workbook.csv.writeBuffer()) as unknown as Buffer;
  }
}
