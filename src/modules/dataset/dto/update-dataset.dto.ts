import { Transform } from 'class-transformer';
import { ArrayMinSize, IsArray, IsOptional, IsString } from 'class-validator';

export class UpdateDatasetDto {
  @IsOptional()
  @IsString({ message: '数据集name必须是字符串！' })
  name?: string;

  @IsOptional()
  @IsString({ message: '数据集description必须是字符串！' })
  description?: string;

  @IsOptional()
  @IsArray({
    message: 'fileIds 必须是数组',
  })
  @ArrayMinSize(1, {
    message: 'fileIds 必须至少有一个元素',
  })
  @Transform(({ value }) => {
    if (typeof value === 'string' && value.includes(',')) {
      return value.split(',').map((item) => parseInt(item, 10));
    } else {
      return value.map((item) => parseInt(item, 10));
    }
  })
  fileIds?: number[];
}
