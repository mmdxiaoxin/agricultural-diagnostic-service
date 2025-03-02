import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';

@Injectable()
export class AvatarSizeValidationPipe implements PipeTransform {
  transform(file: Express.Multer.File) {
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      throw new BadRequestException('文件大小不能超过 5MB');
    }
    return file;
  }
}

@Injectable()
export class AvatarTypeValidationPipe implements PipeTransform {
  transform(file: Express.Multer.File) {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (!allowedTypes.includes(file.mimetype)) {
      throw new BadRequestException('仅支持 JPG, PNG, GIF 格式的图片');
    }
    return file;
  }
}
