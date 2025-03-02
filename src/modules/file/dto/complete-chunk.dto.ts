import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty } from 'class-validator';

export class CompleteChunkDto {
  @IsNotEmpty()
  @IsInt()
  @Type(() => Number)
  taskId: number;
}
