import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';

@Injectable()
export class OccupancyService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Aforo por sede (RF-13): personas con IN sin OUT posterior desde el
   * último reinicio (medianoche). El reinicio a medianoche es el paliativo
   * acordado ante salidas no marcadas (ver C-08 / P-05 en REQUISITOS.md).
   */
  async currentBySite() {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    // TODO: reemplazar por una query SQL que reste OUT de IN por sede desde startOfDay.
    // Devuelve: [{ siteId, codigoSede, nombre, aforoMaximo, ocupacionActual }]
    const sites = await this.prisma.site.findMany({ where: { activa: true } });
    return sites.map((s) => ({
      siteId: s.id,
      codigoSede: s.codigoSede,
      nombre: s.nombre,
      aforoMaximo: s.aforoMaximo,
      ocupacionActual: 0, // TODO calcular con AccessEvent
    }));
  }
}
