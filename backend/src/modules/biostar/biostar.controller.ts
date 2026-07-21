import { Controller, Get } from '@nestjs/common';
import { BiostarService } from './biostar.service';

@Controller('biostar')
export class BiostarController {
  constructor(private readonly service: BiostarService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }
}
