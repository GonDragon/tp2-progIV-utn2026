import { Injectable } from '@nestjs/common';
import * as path from 'node:path';
import * as fs from 'node:fs';

@Injectable()
export class ImgService {
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