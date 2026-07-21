import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';

@Injectable()
export class SitesService {
  constructor(private readonly prisma: PrismaService) {}

  /** Catálogo de sedes (RF-06), usado por los filtros de aforo/reportes y la carga. */
  async findAll() {
    return this.prisma.site.findMany({
      include: { country: true },
      orderBy: { nombre: 'asc' },
    });
  }
}
