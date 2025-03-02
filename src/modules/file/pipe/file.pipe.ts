import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import { unlinkSync } from 'fs';

@Injectable()
export class FileSizeValidationPipe implements PipeTransform {
  transform(file: Express.Multer.File) {
    const maxSize = 20 * 1024 * 1024; // 20MB

    if (file.size > maxSize) {
      // 删除文件
      if (file.path) {
        try {
          unlinkSync(file.path); // 立即删除文件
        } catch (error) {
          console.error('文件删除失败:', error);
        }
      }

      throw new BadRequestException('单次上传数据大小不能超过 20MB');
    }

    return file;
  }
}
