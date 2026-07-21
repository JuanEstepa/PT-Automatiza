import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';

/**
 * Aforo por sede (RF-13, RF-18): quien registró IN y no ha registrado OUT desde
 * medianoche permanece "adentro". El reinicio a medianoche es el paliativo acordado
 * ante salidas no marcadas (ver C-08 / P-05 en REQUISITOS.md) — no se persiste como
 * estado propio (MODELO-DATOS.md §1.5): se deriva de AccessEvent en cada consulta.
 */
@Injectable()
export class OccupancyService {
  constructor(private readonly prisma: PrismaService) {}

  private inicioDelDia(): Date {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }

  /** Último evento de hoy por empleado: quiénes están adentro y en qué sede. */
  private async empleadosDentro(): Promise<Map<number, { siteId: number; desde: Date }>> {
    const eventos = await this.prisma.accessEvent.findMany({
      where: { ocurridoEn: { gte: this.inicioDelDia() }, employeeId: { not: null } },
      orderBy: { ocurridoEn: 'asc' },
      select: { employeeId: true, siteId: true, direccion: true, ocurridoEn: true },
    });

    const estado = new Map<number, { siteId: number; desde: Date; dentro: boolean }>();
    for (const e of eventos) {
      if (e.employeeId === null) continue;
      estado.set(e.employeeId, { siteId: e.siteId, desde: e.ocurridoEn, dentro: e.direccion === 'IN' });
    }

    const dentro = new Map<number, { siteId: number; desde: Date }>();
    for (const [employeeId, v] of estado) {
      if (v.dentro) dentro.set(employeeId, { siteId: v.siteId, desde: v.desde });
    }
    return dentro;
  }

  /** Tablero de aforo (RF-18): ocupación actual de cada sede activa. */
  async currentBySite() {
    const [sites, dentro] = await Promise.all([
      this.prisma.site.findMany({ where: { activa: true }, orderBy: { nombre: 'asc' } }),
      this.empleadosDentro(),
    ]);

    const ocupacionPorSite = new Map<number, number>();
    for (const { siteId } of dentro.values()) {
      ocupacionPorSite.set(siteId, (ocupacionPorSite.get(siteId) ?? 0) + 1);
    }

    return sites.map((s) => {
      const ocupacionActual = ocupacionPorSite.get(s.id) ?? 0;
      return {
        siteId: s.id,
        codigoSede: s.codigoSede,
        nombre: s.nombre,
        ciudad: s.ciudad,
        aforoMaximo: s.aforoMaximo,
        ocupacionActual,
        porcentaje: s.aforoMaximo ? Math.round((ocupacionActual / s.aforoMaximo) * 100) : null,
      };
    });
  }

  /** Detalle de quién está adentro de una sede en este momento (drill-down del tablero). */
  async detalleSede(siteId: number) {
    const dentro = await this.empleadosDentro();
    const employeeIds = [...dentro.entries()].filter(([, v]) => v.siteId === siteId).map(([id]) => id);
    if (employeeIds.length === 0) return [];

    const empleados = await this.prisma.employee.findMany({
      where: { id: { in: employeeIds } },
      select: { id: true, codigoEmpleado: true, primerNombre: true, primerApellido: true, area: true, cargo: true },
      orderBy: { primerNombre: 'asc' },
    });

    return empleados.map((e) => ({ ...e, ingresadoDesde: dentro.get(e.id)!.desde }));
  }
}
