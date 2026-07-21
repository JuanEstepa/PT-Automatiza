import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';

const TIPOS_DISPOSITIVO = ['Puerta principal', 'Torniquete', 'Lector de tarjeta'] as const;

/** Ventanas horarias típicas de entrada/salida por jornada (hora local, minutos incluidos). */
const VENTANAS: Record<string, { entrada: [number, number]; salida: [number, number] }> = {
  DIURNA: { entrada: [6 * 60 + 45, 9 * 60 + 15], salida: [16 * 60 + 45, 19 * 60 + 30] },
  NOCTURNA: { entrada: [18 * 60 + 30, 21 * 60], salida: [5 * 60, 7 * 60 + 30] },
  MIXTA: { entrada: [6 * 60 + 45, 9 * 60 + 15], salida: [16 * 60 + 45, 19 * 60 + 30] },
};

function minutosAleatoriosEn([min, max]: [number, number]): number {
  return min + Math.floor(Math.random() * (max - min));
}

function conHoraYMinuto(dia: Date, minutosDelDia: number): Date {
  const d = new Date(dia);
  d.setHours(0, Math.round(minutosDelDia), Math.floor(Math.random() * 60), 0);
  return d;
}

/**
 * "Ahora" que usa la simulación para decidir qué eventos de hoy ya "ocurrieron". En
 * horario de oficina (7am-8pm) usa la hora real, para que la simulación sea honesta si
 * se corre en vivo durante la sustentación. Fuera de ese rango (ej. medianoche) usa una
 * hora representativa de mitad de jornada, para que el tablero de aforo (RF-18) no
 * quede en 0 en todas las sedes solo por la hora a la que se ejecutó `npm run
 * seed:ingest` o el botón de "regenerar eventos" del frontend.
 */
function horaDeReferencia(): Date {
  const ahora = new Date();
  if (ahora.getHours() >= 7 && ahora.getHours() < 20) return ahora;
  const referencia = new Date(ahora);
  referencia.setHours(11, 30, 0, 0);
  return referencia;
}

/**
 * Adaptador BioStar 2 (patrón puerto/adaptador, ver ARQUITECTURA.md §6). No hay
 * ambiente real disponible: esta implementación SIMULA la API REST documentada en
 * bs2api.biostar2.com (usuarios, puertas/dispositivos, eventos de acceso). El resto de
 * módulos (occupancy, reports) consumen `AccessEvent` sin saber que el origen es un
 * mock; sustituir esto por el cliente real es un cambio localizado a este módulo
 * (RF-19; RF-20 fuera del MVP).
 */
@Injectable()
export class BiostarService {
  private readonly logger = new Logger(BiostarService.name);

  constructor(private readonly prisma: PrismaService) {}

  /** Simula el endpoint de dispositivos de BioStar (puertas/torniquetes por sede). */
  async listDevices() {
    return this.prisma.device.findMany({ include: { site: true } });
  }

  /** Simula el endpoint de usuarios de BioStar, enlazados por `biostarUserId`. */
  async listUsers() {
    return this.prisma.employee.findMany({
      where: { biostarUserId: { not: null }, estado: 'ACTIVO' },
      select: { id: true, codigoEmpleado: true, biostarUserId: true, primerNombre: true, primerApellido: true },
    });
  }

  /** Crea 1-3 dispositivos simulados por sede si aún no existen (idempotente). */
  private async seedDevices(): Promise<void> {
    const sites = await this.prisma.site.findMany({ where: { activa: true } });
    for (const site of sites) {
      const existentes = await this.prisma.device.count({ where: { siteId: site.id } });
      if (existentes > 0) continue;
      for (const [i, tipo] of TIPOS_DISPOSITIVO.entries()) {
        await this.prisma.device.create({
          data: {
            siteId: site.id,
            biostarDeviceId: `SIM-${site.codigoSede}-${i + 1}`,
            nombre: `${tipo} — ${site.nombre}`,
            tipo,
          },
        });
      }
    }
  }

  /**
   * Genera eventos de acceso simulados y realistas para los últimos `dias` (incluido
   * hoy), uno por empleado activo y por día trabajado: IN siempre; OUT solo si, para
   * días pasados, siempre; para hoy, solo si la hora simulada de salida ya pasó — así
   * el tablero de aforo en tiempo real (RF-18) muestra gente "adentro" ahora mismo.
   * Es idempotente por rango de fechas: borra y regenera los eventos simulados del
   * período para poder ejecutarse varias veces sin duplicar (RF-19, simulado).
   */
  async simulateAccessEvents(dias = 7): Promise<{ eventosCreados: number; empleadosConsiderados: number }> {
    await this.seedDevices();

    const empleados = await this.prisma.employee.findMany({
      where: { estado: 'ACTIVO' },
      include: { sites: { include: { site: true } } },
    });

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const desde = new Date(hoy);
    desde.setDate(desde.getDate() - (dias - 1));

    await this.prisma.accessEvent.deleteMany({
      where: { fuente: 'BIOSTAR_SIM', ocurridoEn: { gte: desde } },
    });

    const devices = await this.prisma.device.findMany();
    const devicesBySite = new Map<number, typeof devices>();
    for (const d of devices) {
      const lista = devicesBySite.get(d.siteId) ?? [];
      lista.push(d);
      devicesBySite.set(d.siteId, lista);
    }

    const ahora = horaDeReferencia();
    const eventos: Array<{
      employeeId: number;
      siteId: number;
      deviceId: number | null;
      direccion: string;
      ocurridoEn: Date;
      fuente: string;
    }> = [];

    let empleadosConsiderados = 0;
    for (const empleado of empleados) {
      const sedePrincipal = empleado.sites.find((s) => s.esSedePrincipal)?.site ?? empleado.sites[0]?.site;
      if (!sedePrincipal) continue; // sin sede asignada (ver advertencias de ingesta): no genera eventos
      empleadosConsiderados++;

      const ventana = VENTANAS[empleado.jornada ?? 'DIURNA'] ?? VENTANAS.DIURNA;
      const dispositivosSede = devicesBySite.get(sedePrincipal.id) ?? [];
      const dispositivoAleatorio = () =>
        dispositivosSede.length > 0
          ? dispositivosSede[Math.floor(Math.random() * dispositivosSede.length)].id
          : null;

      for (let offset = dias - 1; offset >= 0; offset--) {
        const dia = new Date(hoy);
        dia.setDate(dia.getDate() - offset);
        const esFinDeSemana = dia.getDay() === 0 || dia.getDay() === 6;
        const probabilidadTrabaja = esFinDeSemana ? 0.15 : 0.92;
        if (Math.random() > probabilidadTrabaja) continue;

        const minutoEntrada = minutosAleatoriosEn(ventana.entrada);
        const entrada = conHoraYMinuto(dia, minutoEntrada);
        if (entrada > ahora) continue; // aún no "ocurre" en el reloj simulado

        eventos.push({
          employeeId: empleado.id,
          siteId: sedePrincipal.id,
          deviceId: dispositivoAleatorio(),
          direccion: 'IN',
          ocurridoEn: entrada,
          fuente: 'BIOSTAR_SIM',
        });

        const esHoy = offset === 0;
        const minutoSalida = minutosAleatoriosEn(ventana.salida);
        const salida = conHoraYMinuto(dia, minutoSalida);
        const yaOcurrioLaSalida = esHoy ? salida <= ahora : true;
        if (yaOcurrioLaSalida && salida > entrada) {
          eventos.push({
            employeeId: empleado.id,
            siteId: sedePrincipal.id,
            deviceId: dispositivoAleatorio(),
            direccion: 'OUT',
            ocurridoEn: salida,
            fuente: 'BIOSTAR_SIM',
          });
        }
      }
    }

    if (eventos.length > 0) {
      await this.prisma.accessEvent.createMany({ data: eventos });
    }

    this.logger.log(`Simulación BioStar: ${eventos.length} eventos para ${empleadosConsiderados} empleados`);
    return { eventosCreados: eventos.length, empleadosConsiderados };
  }
}
