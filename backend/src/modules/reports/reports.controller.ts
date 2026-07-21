import { Controller, Get } from '@nestjs/common';
import { ReportsService } from './reports.service';

@Controller('reports')
export class ReportsController {
  constructor(private readonly service: ReportsService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }
}
