import { Controller, Get, Post, Query } from '@nestjs/common';
import { BiostarService } from './biostar.service';

@Controller('biostar')
export class BiostarController {
  constructor(private readonly service: BiostarService) {}

  @Get('devices')
  listDevices() {
    return this.service.listDevices();
  }

  @Get('users')
  listUsers() {
    return this.service.listUsers();
  }

  /** Regenera los eventos de acceso simulados (poblar aforo/reportes con datos frescos). */
  @Post('simulate')
  simulate(@Query('dias') dias?: string) {
    return this.service.simulateAccessEvents(dias ? Number(dias) : undefined);
  }
}
