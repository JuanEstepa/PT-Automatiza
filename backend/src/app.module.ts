import { Module } from '@nestjs/common';
import { PrismaModule } from './common/prisma.module';
import { EmployeesModule } from './modules/employees/employees.module';
import { SitesModule } from './modules/sites/sites.module';
import { OccupancyModule } from './modules/occupancy/occupancy.module';
import { ReportsModule } from './modules/reports/reports.module';
import { IngestionModule } from './modules/ingestion/ingestion.module';
import { BiostarModule } from './modules/biostar/biostar.module';

@Module({
  imports: [
    PrismaModule,
    EmployeesModule,
    SitesModule,
    OccupancyModule,
    ReportsModule,
    IngestionModule,
    BiostarModule,
  ],
})
export class AppModule {}
