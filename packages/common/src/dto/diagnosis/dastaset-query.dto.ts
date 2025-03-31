import { IsOptional, IsString } from 'class-validator';
import { PageQueryDateDto } from '../page-query-date.dto';
import { ApiProperty } from '@nestjs/swagger';

export class DatasetQueryDto extends PageQueryDateDto {
  @IsOptional()
  @IsString()
  @ApiProperty({ description: '数据集名称' })
  name?: string;
}
