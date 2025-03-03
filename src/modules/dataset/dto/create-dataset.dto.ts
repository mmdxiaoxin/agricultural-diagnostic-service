import { Transform } from 'class-transformer';
import {
  IsString,
  IsOptional,
  IsArray,
  IsNotEmpty,
  IsInt,
} from 'class-validator';

export class CreateDatasetDto {
  @IsString({ message: '数据集name必须是字符串！' })
  @IsNotEmpty({ message: '数据集name不能为空！' })
  name: string;

  @IsOptional()
  @IsString({ message: '数据集description必须是字符串！' })
  description?: string;

  @IsOptional()
  @IsArray({
    message: 'fileIds 必须是数组',
  })
  @Transform(({ value }) => {
    if (typeof value === 'string' && value.includes(',')) {
      return value.split(',').map((item) => parseInt(item, 10));
    } else {
      return value.map((item) => parseInt(item, 10));
    }
  })
  @IsInt({ each: true, message: 'fileIds 必须是数字' })
  fileIds?: number[];
}
