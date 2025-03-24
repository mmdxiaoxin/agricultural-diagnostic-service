import {
  Injectable,
  PipeTransform,
  ArgumentMetadata,
  BadRequestException,
} from '@nestjs/common';

@Injectable()
export class ParseNumberArrayPipe implements PipeTransform {
  transform(value: any, metadata: ArgumentMetadata) {
    // 如果没有传递参数，抛出异常
    if (!value) {
      throw new BadRequestException('文件 ID 不能为空');
    }

    // 如果值是字符串，尝试分割并转换为数字数组
    if (typeof value === 'string') {
      const fileIds = value.split(',').map((id) => {
        const numberId = Number(id);
        if (isNaN(numberId)) {
          throw new BadRequestException(`无效的文件 ID: ${id}`);
        }
        return numberId;
      });

      return fileIds;
    }

    // 如果值已经是数组，直接返回数组
    if (Array.isArray(value)) {
      const fileIds = value.map((id) => {
        const numberId = Number(id);
        if (isNaN(numberId)) {
          throw new BadRequestException(`无效的文件 ID: ${id}`);
        }
        return numberId;
      });

      return fileIds;
    }

    // 如果值既不是字符串也不是数组，抛出异常
    throw new BadRequestException('文件 ID 参数格式错误');
  }
}
