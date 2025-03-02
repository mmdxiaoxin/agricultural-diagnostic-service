import { IsInt, IsNotEmpty, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class UploadChunkDto {
  @IsNotEmpty({ message: '任务ID不能为空！' })
  @IsInt({ message: '任务ID必须为数字类型！' })
  @Type(() => Number) // 自动转换为 number
  taskId: number;

  @IsNotEmpty({ message: '文件MD5不能为空！' })
  @IsString({ message: '文件MD5必须为字符串类型！' })
  @Type(() => String)
  fileMd5: string;

  @IsNotEmpty({ message: '文件块不能为空！' })
  @IsInt({ message: '文件块必须为数字类型！' })
  @Type(() => Number) // 自动转换为 number
  chunkIndex: number;
}
