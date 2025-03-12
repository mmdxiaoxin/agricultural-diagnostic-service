import { Injectable } from '@nestjs/common';

@Injectable()
export class DownloadServiceService {
  getHello(): string {
    return 'Hello World!';
  }
}
