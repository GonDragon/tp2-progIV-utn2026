import { Module } from '@nestjs/common';
import { ImgService } from './img.service.js';
import { ImgController } from './img.controller.js';

@Module({
  imports: [],
  controllers: [ImgController],
  providers: [ImgService],
})
export class ImgModule {}
