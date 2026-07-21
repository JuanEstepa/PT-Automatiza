import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';

@Injectable()
export class EmployeesService {
  constructor(private readonly prisma: PrismaService) {}

  // TODO: implementar lógica de dominio (ver REQUISITOS.md)
  async findAll() {
    return [];
  }
}
