import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { PageQueryDto } from './page-query.dto';

export class PageQueryDateDto extends PageQueryDto {
  @IsOptional()
  @IsString()
  @ApiProperty({ description: '创建开始时间' })
  createdStart?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ description: '创建结束时间' })
  createdEnd?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ description: '更新开始时间' })
  updatedStart?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ description: '更新结束时间' })
  updatedEnd?: string;
}
