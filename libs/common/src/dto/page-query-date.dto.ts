import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsOptional } from 'class-validator';
import { PageQueryDto } from './page-query.dto';

export class PageQueryDateDto extends PageQueryDto {
  @IsOptional()
  @IsDateString()
  @ApiProperty({
    description: '创建开始时间',
    example: '2023-01-01T00:00:00Z',
    required: false,
  })
  createdStart?: string;

  @IsOptional()
  @IsDateString()
  @ApiProperty({
    description: '创建结束时间',
    example: '2023-12-31T23:59:59Z',
    required: false,
  })
  createdEnd?: string;

  @IsOptional()
  @IsDateString()
  @ApiProperty({
    description: '更新开始时间',
    example: '2023-01-01T00:00:00Z',
    required: false,
  })
  updatedStart?: string;

  @IsOptional()
  @IsDateString()
  @ApiProperty({
    description: '更新结束时间',
    example: '2023-12-31T23:59:59Z',
    required: false,
  })
  updatedEnd?: string;
}
