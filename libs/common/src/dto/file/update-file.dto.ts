import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
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
  @ApiProperty({
    description: '文件ID',
    example: 1,
  })
  fileId: number;

  @IsOptional()
  @IsString({ message: '文件名称必须为字符串类型！' })
  @Length(5, 255, {
    message: '文件名称应该过短或者过长',
  })
  @ApiProperty({
    description: '文件名称',
    example: '文件1',
    required: false,
  })
  originalFileName?: string;

  @IsOptional()
  @IsString({ message: '文件路径必须为字符串类型！' })
  @IsIn(['public', 'private'], {
    message: '请使用 "public" 或者 "private" 来设置权限',
  })
  @ApiProperty({
    description: '权限',
    example: 'public',
    required: false,
  })
  access?: string;
}

export class UpdateFilesAccessDto {
  @IsNotEmpty({ message: '文件ID不能为空！' })
  @IsArray({ message: '文件ID必须为数组类型！' })
  @ArrayMinSize(1, { message: '文件ID数组长度至少为1！' })
  @Transform(({ value }) => value.map((v: string) => Number(v)), {
    toClassOnly: true,
  })
  @IsInt({ each: true, message: '文件ID必须为数字类型！' })
  @ApiProperty({
    description: '文件ID',
    example: [1, 2, 3],
    required: true,
  })
  fileIds: number[];

  @IsNotEmpty({ message: '权限不能为空！' })
  @IsIn(['public', 'private'], {
    message: '请使用 "public" 或者 "private" 来设置权限',
  })
  @ApiProperty({
    description: '权限',
    example: 'public',
    required: true,
  })
  access: string;
}
