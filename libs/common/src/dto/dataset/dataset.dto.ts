import { ApiProperty } from '@nestjs/swagger';
import { FileDto } from '../file/file.dto';
import { BaseDto } from '../base.dto';

export class DatasetDto extends BaseDto {
  @ApiProperty({
    description: '数据集名称',
    example: '测试数据集555',
  })
  name: string;

  @ApiProperty({
    description: '数据集描述',
    example: '',
    required: false,
  })
  description: string;

  @ApiProperty({
    description: '访问权限 (public: 公开, private: 私有)',
    example: 'public',
    enum: ['public', 'private'],
  })
  access: string;

  @ApiProperty({
    description: '创建者ID',
    example: 16,
  })
  createdBy: number;

  @ApiProperty({
    description: '更新者ID',
    example: 16,
  })
  updatedBy: number;
}

export class DatasetWithCountDto extends DatasetDto {
  @ApiProperty({
    description: '文件数量',
    example: 5,
  })
  fileCount: number;

  @ApiProperty({
    description: '数据集大小（字节）',
    example: 292479,
  })
  datasetSize: number;
}

export class DatasetWithFileDto extends DatasetDto {
  @ApiProperty({
    description: '文件ID',
    example: [1, 2, 3],
  })
  fileIds: number[];

  @ApiProperty({
    description: '文件列表',
    example: [
      { id: 1, name: '文件1', size: 100, type: 'image/jpeg' },
      { id: 2, name: '文件2', size: 200, type: 'image/png' },
    ],
  })
  files: FileDto[];
}
