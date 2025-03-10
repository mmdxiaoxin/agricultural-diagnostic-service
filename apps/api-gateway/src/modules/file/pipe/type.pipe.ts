import {
  ArgumentMetadata,
  BadRequestException,
  Injectable,
  PipeTransform,
} from '@nestjs/common';

@Injectable()
export class ParseFileTypePipe implements PipeTransform {
  transform(value: any, metadata: ArgumentMetadata) {
    // 如果值是 undefined 或 null，直接返回
    if (value === undefined || value === null || value === '') {
      return value;
    }

    // 如果值是字符串并且包含逗号，尝试将其分割为字符串数组
    if (typeof value === 'string') {
      // 去除多余的空格后再拆分
      const result = value
        .split(',')
        .map((item) => item.trim())
        .filter((item) => item);

      // 如果分割后的结果为空，抛出错误
      if (result.length === 0) {
        throw new BadRequestException('文件类型不能为空');
      }

      return result;
    }

    // 如果值已经是数组，确保数组元素是字符串类型
    if (Array.isArray(value)) {
      // 确保数组中的每个元素都是字符串
      const result = value.map((item) => {
        if (typeof item !== 'string') {
          throw new BadRequestException('文件类型数组中的每个元素必须是字符串');
        }
        return item.trim();
      });

      return result;
    }

    // 如果值既不是字符串也不是数组，抛出错误
    throw new BadRequestException('文件类型参数格式不正确');
  }
}
