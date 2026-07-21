import { Injectable } from '@nestjs/common';

/**
 * Adaptador BioStar 2 (patrón puerto/adaptador). NO hay ambiente real
 * (ver ARQUITECTURA.md): esta implementación SIMULA la API REST
 * documentada en https://bs2api.biostar2.com/ (usuarios, puertas,
 * dispositivos, grupos de acceso). Sustituible por el cliente real
 * sin tocar el resto de módulos.
 */
@Injectable()
export class BiostarService {
  // TODO: generar eventos de acceso simulados para poblar el aforo y los reportes.
  async syncUser(_biostarUserId: string) {
    return { ok: true, simulated: true };
  }

  async listDevices() {
    return [{ id: 'sim-1', name: 'Molinete Torre - Lobby', simulated: true }];
  }
}
