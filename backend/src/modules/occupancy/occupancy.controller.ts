import { Controller, Get } from '@nestjs/common';
import { OccupancyService } from './occupancy.service';

@Controller('occupancy')
export class OccupancyController {
  constructor(private readonly service: OccupancyService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }
}
