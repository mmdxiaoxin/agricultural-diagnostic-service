import { IsInt, IsNotEmpty, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class UploadChunkDto {
  @IsNotEmpty({ message: '任务ID不能为空！' })
  @IsInt({ message: '任务ID必须为数字类型！' })
  @Type(() => Number) // 自动转换为 number
  @ApiProperty({
    description: '任务ID',
    example: 1,
  })
  taskId: number;

  @IsNotEmpty({ message: '文件MD5不能为空！' })
  @IsString({ message: '文件MD5必须为字符串类型！' })
  @Type(() => String)
  @ApiProperty({
    description: '文件MD5',
    example: 'd41d8cd98f00b204e9800998ecf8427e',
  })
  fileMd5: string;

  @IsNotEmpty({ message: '文件块不能为空！' })
  @IsInt({ message: '文件块必须为数字类型！' })
  @Type(() => Number) // 自动转换为 number
  @ApiProperty({
    description: '文件块',
    example: 1,
  })
  chunkIndex: number;
}
