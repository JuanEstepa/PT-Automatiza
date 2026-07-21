import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { runIngestion } from './ingestion.core';
import type { IngestionSummary, RowEstado } from './ingestion.types';

@Injectable()
export class IngestionService {
  constructor(private readonly prisma: PrismaService) {}

  /** RF-07..RF-12: ejecuta la carga completa a partir del binario del Excel subido. */
  async ingestFromBuffer(buffer: Buffer, nombreArchivo: string): Promise<IngestionSummary> {
    return runIngestion(this.prisma, buffer, nombreArchivo);
  }

  /** Últimos lotes de carga, para la pantalla de "detalles de la última carga". */
  async listBatches() {
    return this.prisma.ingestionBatch.findMany({
      orderBy: { ejecutadoEn: 'desc' },
      take: 20,
    });
  }

  /**
   * Lote más reciente con el detalle fila a fila (RF-11), con la misma forma que
   * devuelve `ingestFromBuffer` (IngestionSummary) para que el frontend no tenga que
   * distinguir "resumen recién subido" de "resumen recargado desde el servidor".
   */
  async getLatestBatch(): Promise<IngestionSummary | null> {
    const batch = await this.prisma.ingestionBatch.findFirst({
      orderBy: { ejecutadoEn: 'desc' },
      include: {
        rows: {
          orderBy: { numeroFila: 'asc' },
          include: { employee: { select: { codigoEmpleado: true } } },
        },
      },
    });
    if (!batch) return null;

    return {
      batchId: batch.id,
      nombreArchivo: batch.nombreArchivo,
      ejecutadoEn: batch.ejecutadoEn,
      totalFilas: batch.totalFilas,
      filasOk: batch.filasOk,
      filasAdvertencia: batch.rows.filter((r) => r.estado === 'ADVERTENCIA').length,
      filasRechazadas: batch.filasRechazadas,
      // Las filas RECHAZADAS no tienen employeeId (no se crea el empleado), así que su
      // codigo_empleado original no queda persistido; se pierde al recargar la página
      // (sí está disponible en el momento de la carga, ver runIngestion en ingestion.core.ts).
      filas: batch.rows.map((r) => ({
        fila: r.numeroFila,
        estado: r.estado as RowEstado,
        motivo: r.motivo,
        codigoEmpleado: r.employee?.codigoEmpleado ?? null,
        employeeId: r.employeeId,
      })),
    };
  }
}
