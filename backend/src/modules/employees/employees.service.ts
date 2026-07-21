import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';

export interface EmployeeFiltros {
  siteId?: number;
  estado?: string;
  q?: string;
}

@Injectable()
export class EmployeesService {
  constructor(private readonly prisma: PrismaService) {}

  /** Listado de empleados para la pantalla "Empleados" del frontend (RF-01..RF-04). */
  async findAll(filtros: EmployeeFiltros = {}) {
    return this.prisma.employee.findMany({
      where: {
        estado: filtros.estado,
        sites: filtros.siteId ? { some: { siteId: filtros.siteId } } : undefined,
        OR: filtros.q
          ? [
              { primerNombre: { contains: filtros.q, mode: 'insensitive' } },
              { primerApellido: { contains: filtros.q, mode: 'insensitive' } },
              { codigoEmpleado: { contains: filtros.q, mode: 'insensitive' } },
            ]
          : undefined,
      },
      include: {
        country: true,
        documents: { include: { documentType: true } },
        sites: { include: { site: true } },
      },
      orderBy: { primerNombre: 'asc' },
    });
  }
}
