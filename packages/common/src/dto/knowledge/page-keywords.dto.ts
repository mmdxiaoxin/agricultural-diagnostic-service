import { ApiProperty } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';
import { PageQueryDto } from '../page-query.dto';

export class PageKeywordsDto extends PageQueryDto {
  @IsOptional()
  @ApiProperty({ description: '搜索关键词' })
  keyword: string;
}
