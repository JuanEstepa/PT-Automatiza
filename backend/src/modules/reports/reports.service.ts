import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Reporte de auditoría filtrable por rango de fechas y sede (RF-16).
   * Todo resultado debe poder exportarse a Excel/CSV (RF-17).
   */
  async audit(params: { from?: Date; to?: Date; siteId?: number }) {
    return this.prisma.accessEvent.findMany({
      where: {
        siteId: params.siteId,
        ocurridoEn: { gte: params.from, lte: params.to },
      },
      include: { employee: true, site: true },
      orderBy: { ocurridoEn: 'desc' },
    });
  }
}
