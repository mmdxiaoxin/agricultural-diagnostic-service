import { IsInt, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';

export class UploadChunkDto {
  @IsNotEmpty()
  @IsInt()
  @Type(() => Number) // 自动转换为 number
  taskId: number;

  @IsNotEmpty()
  @IsInt()
  @Type(() => Number) // 自动转换为 number
  chunkIndex: number;
}
