import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { ImgService } from './img.service.js';
import { ImgController } from './img.controller.js';

@Module({
  imports: [
    MulterModule.registerAsync({
      useClass: ImgService,
    }),
  ],
  controllers: [ImgController],
  providers: [ImgService],
  exports: [ImgService],
})
export class ImgModule {}
