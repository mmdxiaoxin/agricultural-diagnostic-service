import { IsOptional, IsString } from 'class-validator';
import { PageQueryDateDto } from '../page-query-date.dto';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class FileQueryDto extends PageQueryDateDto {
  @IsOptional()
  @IsString()
  @ApiProperty({ description: '文件名', required: false })
  originalFileName?: string;

  @IsOptional()
  @IsString({ each: true })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.split(',') : value,
  )
  @ApiProperty({
    description: '文件类型',
    type: String,
    isArray: true,
    example: 'jpg,png,pdf',
    required: false,
  })
  fileType?: string[];
}
