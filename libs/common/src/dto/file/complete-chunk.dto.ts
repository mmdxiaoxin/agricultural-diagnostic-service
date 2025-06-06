import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty } from 'class-validator';

export class CompleteChunkDto {
  @IsNotEmpty()
  @ApiProperty({
    description: '任务ID',
    example: 1,
  })
  taskId: string;
}
