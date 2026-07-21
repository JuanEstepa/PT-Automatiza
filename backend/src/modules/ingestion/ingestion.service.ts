import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { runIngestion } from './ingestion.core';
import type { IngestionSummary } from './ingestion.types';

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

  /** Lote más reciente con el detalle fila a fila (RF-11). */
  async getLatestBatch() {
    return this.prisma.ingestionBatch.findFirst({
      orderBy: { ejecutadoEn: 'desc' },
      include: { rows: { orderBy: { numeroFila: 'asc' } } },
    });
  }
}
