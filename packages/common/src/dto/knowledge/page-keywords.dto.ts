import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { PageQueryDto } from '../page-query.dto';

export class PageKeywordsDto extends PageQueryDto {
  @IsOptional()
  @IsString()
  @ApiProperty({ description: '搜索关键词' })
  keyword?: string;
}
