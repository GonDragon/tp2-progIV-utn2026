import { BadRequestException, Injectable } from '@nestjs/common';
import type {
  MulterModuleOptions,
  MulterOptionsFactory,
} from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import * as path from 'node:path';
import * as fs from 'node:fs';

@Injectable()
export class ImgService implements MulterOptionsFactory {
  createMulterOptions(): MulterModuleOptions {
    return {
      storage: diskStorage({
        destination: (_req, _file, cb) => {
          const uploadDir = this.getUploadDir();
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
    };
  }

  getUploadDir(): string {
    let uploadDir: string;
    if (fs.existsSync('/usr/src/app/data')) {
      uploadDir = '/usr/src/app/data/upload';
    } else if (fs.existsSync(path.resolve(process.cwd(), '../data'))) {
      uploadDir = path.resolve(process.cwd(), '../data/upload');
    } else if (fs.existsSync(path.resolve(process.cwd(), 'data'))) {
      uploadDir = path.resolve(process.cwd(), 'data/upload');
    } else {
      uploadDir = '/usr/src/app/data/upload';
    }

    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    return uploadDir;
  }

  getImagePath(filename: string): string {
    const safeFilename = path.basename(filename);
    return path.join(this.getUploadDir(), safeFilename);
  }

  imageExists(filename: string): boolean {
    const filePath = this.getImagePath(filename);
    return fs.existsSync(filePath);
  }
}