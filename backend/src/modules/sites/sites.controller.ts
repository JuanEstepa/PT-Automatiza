import { Controller, Get } from '@nestjs/common';
import { SitesService } from './sites.service';

@Controller('sites')
export class SitesController {
  constructor(private readonly service: SitesService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }
}
