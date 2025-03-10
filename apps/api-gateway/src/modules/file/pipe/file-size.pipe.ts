import { parseSize } from '@shared/utils';
import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import { unlinkSync } from 'fs';

@Injectable()
export class FileSizeValidationPipe implements PipeTransform {
  constructor(private readonly maxSize: string) {}

  transform(file: Express.Multer.File) {
    // 解析传入的 maxSize 字符串，转换为字节数
    let parsedSize: number;
    try {
      parsedSize = parseSize(this.maxSize);
    } catch (error) {
      throw new BadRequestException(`无效的文件大小限制: ${this.maxSize}`);
    }

    if (!file) {
      throw new BadRequestException('未找到上传的文件');
    }
    // 判断文件大小是否超出限制
    if (file.size > parsedSize) {
      // 删除文件
      if (file.path) {
        try {
          unlinkSync(file.path); // 立即删除文件
        } catch (error) {
          console.error('文件删除失败:', error);
        }
      }

      throw new BadRequestException(`单次上传数据大小不能超过 ${this.maxSize}`);
    }
    return file;
  }
}
