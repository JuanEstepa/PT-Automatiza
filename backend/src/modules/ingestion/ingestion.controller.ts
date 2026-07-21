import {
  BadRequestException,
  Controller,
  Get,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { IngestionService } from './ingestion.service';

@Controller('ingestion')
export class IngestionController {
  constructor(private readonly service: IngestionService) {}

  /** Carga del Excel de Talento Humano desde la pantalla de "Carga" del frontend. */
  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async upload(@UploadedFile() file?: Express.Multer.File) {
    if (!file) throw new BadRequestException('Falta el archivo (campo "file")');
    return this.service.ingestFromBuffer(file.buffer, file.originalname);
  }

  @Get('batches')
  listBatches() {
    return this.service.listBatches();
  }

  @Get('batches/latest')
  getLatestBatch() {
    return this.service.getLatestBatch();
  }
}
