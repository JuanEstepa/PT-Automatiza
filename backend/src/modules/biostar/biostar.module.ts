import { Module } from '@nestjs/common';
import { BiostarController } from './biostar.controller';
import { BiostarService } from './biostar.service';

@Module({
  controllers: [BiostarController],
  providers: [BiostarService],
  exports: [BiostarService],
})
export class BiostarModule {}
