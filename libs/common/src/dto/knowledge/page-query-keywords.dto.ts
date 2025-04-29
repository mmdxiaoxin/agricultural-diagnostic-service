import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { PageQueryDto } from '../page-query.dto';

export class PageQueryKeywordsDto extends PageQueryDto {
  @IsOptional()
  @IsString()
  @ApiProperty({ description: '搜索关键词', required: false })
  keyword?: string;
}
