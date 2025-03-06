import { MIME_TYPE } from '@/shared/enum/mime.enum';
import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';

@Injectable()
export class FileTypeValidationPipe implements PipeTransform {
  constructor(private readonly allowedTypes: MIME_TYPE[]) {}

  transform(file: Express.Multer.File) {
    // 检查文件的 MIME 类型是否在允许的类型中
    if (!this.allowedTypes.includes(file.mimetype as any)) {
      throw new BadRequestException(
        `仅支持以下格式的图片: ${this.allowedTypes.join(', ')}`,
      );
    }
    return file;
  }
}
