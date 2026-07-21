import { Controller, Get, Query, Res } from '@nestjs/common';
import type { Response } from 'express';
import { ReportsService, type AuditoriaFiltros } from './reports.service';

function parseFiltros(desde?: string, hasta?: string, siteId?: string): AuditoriaFiltros {
  return {
    desde: desde ? new Date(desde) : undefined,
    // "hasta" es inclusivo hasta el final del día si solo viene la fecha (sin hora).
    hasta: hasta ? new Date(`${hasta}T23:59:59.999`) : undefined,
    siteId: siteId ? Number(siteId) : undefined,
  };
}

@Controller('reports')
export class ReportsController {
  constructor(private readonly service: ReportsService) {}

  @Get('audit')
  audit(@Query('desde') desde?: string, @Query('hasta') hasta?: string, @Query('siteId') siteId?: string) {
    return this.service.audit(parseFiltros(desde, hasta, siteId));
  }

  @Get('audit/export')
  async export(
    @Res() res: Response,
    @Query('formato') formato: 'xlsx' | 'csv' = 'xlsx',
    @Query('desde') desde?: string,
    @Query('hasta') hasta?: string,
    @Query('siteId') siteId?: string,
  ) {
    const filtros = parseFiltros(desde, hasta, siteId);
    const nombreArchivo = `auditoria-accesos.${formato}`;

    if (formato === 'csv') {
      const buffer = await this.service.exportarCsv(filtros);
      res.set({
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${nombreArchivo}"`,
      });
      res.send(buffer);
      return;
    }

    const buffer = await this.service.exportarExcel(filtros);
    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${nombreArchivo}"`,
    });
    res.send(buffer);
  }
}
