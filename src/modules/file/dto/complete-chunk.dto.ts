import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty } from 'class-validator';

export class CompleteChunkDto {
  @IsNotEmpty()
  @IsInt({ message: '任务ID必须为数字类型' })
  @Type(() => Number)
  taskId: number;
}
