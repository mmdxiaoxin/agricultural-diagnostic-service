import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { Observable } from 'rxjs';
import * as fs from 'fs';

@Injectable()
export class SingleFileInterceptor implements NestInterceptor {
  private fileInterceptor: any;

  constructor() {
    this.fileInterceptor = FileInterceptor('file', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          let folder = 'uploads/other';
          const mimeType = file.mimetype;

          if (mimeType.startsWith('image')) {
            folder = 'uploads/images';
          } else if (mimeType.startsWith('video')) {
            folder = 'uploads/videos';
          } else if (mimeType.startsWith('application')) {
            folder = 'uploads/documents';
          } else if (mimeType.startsWith('audio')) {
            folder = 'uploads/audio';
          }

          if (!fs.existsSync(folder)) {
            fs.mkdirSync(folder, { recursive: true });
          }
          cb(null, folder);
        },
        filename: (req, file, cb) => {
          const uniqueName = `${Date.now()}-${uuidv4()}`;
          file.originalname = Buffer.from(file.originalname, 'latin1').toString(
            'utf-8',
          );
          cb(null, uniqueName);
        },
      }),
    });
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return this.fileInterceptor.intercept(context, next);
  }
}
