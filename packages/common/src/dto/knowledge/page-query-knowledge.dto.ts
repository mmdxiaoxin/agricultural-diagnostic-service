import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { PageQueryKeywordsDto } from './page-query-keywords.dto';

export class PageQueryKnowledgeDto extends PageQueryKeywordsDto {
  @IsOptional()
  @IsString()
  @ApiProperty({ description: '作物ID', required: false })
  cropId?: string;
}
