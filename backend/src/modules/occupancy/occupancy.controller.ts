import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { OccupancyService } from './occupancy.service';

@Controller('occupancy')
export class OccupancyController {
  constructor(private readonly service: OccupancyService) {}

  @Get()
  currentBySite() {
    return this.service.currentBySite();
  }

  @Get(':siteId')
  detalleSede(@Param('siteId', ParseIntPipe) siteId: number) {
    return this.service.detalleSede(siteId);
  }
}
