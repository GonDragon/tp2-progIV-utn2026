import { BadRequestException, Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import * as path from 'node:path';
import { ImgService } from './img.service.js';
import { ImgController } from './img.controller.js';

@Module({
  imports: [
    MulterModule.registerAsync({
      useFactory: (imgService: ImgService) => ({
        storage: diskStorage({
          destination: (_req, _file, cb) => {
            const uploadDir = imgService.getUploadDir();
            cb(null, uploadDir);
          },
          filename: (_req, file, cb) => {
            const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
            const ext = path.extname(file.originalname).toLowerCase();
            cb(null, `${uniqueSuffix}${ext}`);
          },
        }),
        fileFilter: (_req, file, cb) => {
          const ext = path.extname(file.originalname).toLowerCase();
          const allowedExtensions = ['.png', '.jpg', '.jpeg'];
          if (allowedExtensions.includes(ext)) {
            cb(null, true);
          } else {
            cb(
              new BadRequestException(
                'Solo se permiten imágenes con extensión png o jpg',
              ),
              false,
            );
          }
        },
      }),
      inject: [ImgService],
    }),
  ],
  controllers: [ImgController],
  providers: [ImgService],
  exports: [ImgService],
})
export class ImgModule {}
