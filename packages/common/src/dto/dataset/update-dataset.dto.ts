import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsArray, IsInt, IsOptional, IsString } from 'class-validator';

export class UpdateDatasetDto {
  @IsString({ message: '数据集name必须是字符串！' })
  @IsOptional({ message: '数据集name不能为空！' })
  @ApiProperty({
    description: '数据集名称',
    example: '数据集1',
  })
  name: string;

  @IsOptional()
  @IsString({ message: '数据集description必须是字符串！' })
  @ApiProperty({
    description: '数据集描述',
    example: '这是一个数据集',
  })
  description?: string;

  @IsOptional()
  @IsArray({
    message: 'fileIds 必须是数组',
  })
  @Transform(({ value }) => {
    if (typeof value === 'string' && value.includes(',')) {
      return value.split(',').map((item) => parseInt(item, 10));
    } else {
      return value.map((item) => parseInt(item, 10));
    }
  })
  @IsInt({ each: true, message: 'fileIds 必须是数字' })
  @ApiProperty({
    description: '文件ID',
    example: [1, 2, 3],
  })
  fileIds?: number[];
}
