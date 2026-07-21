import { Controller, Get, Query } from '@nestjs/common';
import { EmployeesService } from './employees.service';

@Controller('employees')
export class EmployeesController {
  constructor(private readonly service: EmployeesService) {}

  @Get()
  findAll(
    @Query('siteId') siteId?: string,
    @Query('estado') estado?: string,
    @Query('q') q?: string,
  ) {
    return this.service.findAll({
      siteId: siteId ? Number(siteId) : undefined,
      estado,
      q,
    });
  }
}
