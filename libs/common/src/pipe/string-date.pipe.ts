import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';
import { isDate } from 'class-validator'; // 可使用 class-validator 库检查日期格式

@Injectable()
export class ParseStringDatePipe implements PipeTransform {
  transform(value: string) {
    if (value && !isDate(new Date(value))) {
      throw new BadRequestException('非法日期格式');
    }
    return value;
  }
}
