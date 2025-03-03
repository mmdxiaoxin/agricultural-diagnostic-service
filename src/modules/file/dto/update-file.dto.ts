import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
} from 'class-validator';

export class UpdateFileDto {
  @IsNotEmpty({ message: '文件ID不能为空！' })
  @IsInt({ message: '文件ID必须为数字类型！' })
  @Type(() => Number)
  fileId: number;

  @IsOptional()
  @IsString({ message: '文件名称必须为字符串类型！' })
  @Length(5, 255, {
    message: '文件名称应该过短或者过长',
  })
  originalFileName?: string;

  @IsOptional()
  @IsString({ message: '文件路径必须为字符串类型！' })
  @IsIn(['public', 'private'], {
    message: '请使用 "public" 或者 "private" 来设置权限',
  })
  access?: string;
}
