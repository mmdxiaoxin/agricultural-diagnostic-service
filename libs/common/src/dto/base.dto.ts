import { ApiProperty } from '@nestjs/swagger';

export class BaseDto {
  @ApiProperty({ description: 'ID', example: 1 })
  id: number;

  @ApiProperty({
    description: '创建时间',
    example: '2025-04-28T05:15:24.291Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: '更新时间',
    example: '2025-04-28T14:17:29.422Z',
  })
  updatedAt: Date;
}
