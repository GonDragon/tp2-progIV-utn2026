import {
  Controller,
  Get,
  Post,
  Param,
  Res,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { ImgService } from './img.service.js';

@Controller('img')
export class ImgController {
  constructor(private readonly imgService: ImgService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  uploadImage(@UploadedFile() file?: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException(
        'Debe proporcionar un archivo de imagen válido (solo formatos png y jpg)',
      );
    }

    return {
      filename: file.filename,
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      url: `/img/get/${file.filename}`,
    };
  }

  @Get('get/:filename')
  getImage(@Param('filename') filename: string, @Res() res: Response) {
    if (!filename) {
      throw new BadRequestException('Debe especificar un nombre de archivo');
    }

    const filePath = this.imgService.getImagePath(filename);
    if (!this.imgService.imageExists(filename)) {
      throw new NotFoundException('Imagen no encontrada');
    }

    return res.sendFile(filePath);
  }
}
