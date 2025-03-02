import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { Observable } from 'rxjs';
import * as fs from 'fs';

@Injectable()
export class ChunkFileInterceptor implements NestInterceptor {
  private fileInterceptor: any;

  constructor() {
    this.fileInterceptor = FileInterceptor('file', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const folder = 'uploads/chunks';
          if (!fs.existsSync(folder)) {
            fs.mkdirSync(folder, { recursive: true });
          }
          cb(null, folder);
        },
        filename: (req, file, cb) => {
          const { task_id, chunkIndex } = req.body;

          if (!task_id || !chunkIndex) {
            return cb(
              new Error('Missing task_id or chunkIndex'),
              file.filename,
            );
          }
          cb(null, `${task_id}-${chunkIndex}`);
        },
      }),
    });
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return this.fileInterceptor.intercept(context, next);
  }
}
