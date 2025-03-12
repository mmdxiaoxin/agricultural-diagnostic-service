import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty } from 'class-validator';

export class CompleteChunkDto {
  @IsNotEmpty()
  @IsInt({ message: '任务ID必须为数字类型' })
  @Type(() => Number)
  @ApiProperty({
    description: '任务ID',
    example: 1,
  })
  taskId: number;
}
