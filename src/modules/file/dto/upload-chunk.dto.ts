import { IsInt, IsNotEmpty, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class UploadChunkDto {
  @IsNotEmpty()
  @IsInt()
  @Type(() => Number) // 自动转换为 number
  taskId: number;

  @IsNotEmpty()
  @IsString()
  @Type(() => String)
  fileMd5: string;

  @IsNotEmpty()
  @IsInt()
  @Type(() => Number) // 自动转换为 number
  chunkIndex: number;
}
