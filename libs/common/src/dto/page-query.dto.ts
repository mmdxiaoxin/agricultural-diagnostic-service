import { ApiProperty } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';

export class PageQueryDto {
  @IsOptional()
  @ApiProperty({ description: '页码' })
  page: number;

  @IsOptional()
  @ApiProperty({ description: '每页条数' })
  pageSize: number;
}
