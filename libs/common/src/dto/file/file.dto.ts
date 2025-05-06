import { ApiProperty } from '@nestjs/swagger';
import { BaseDto } from '../base.dto';

export class FileDto extends BaseDto {
  @ApiProperty({
    description: '原始文件名',
    example: '(XQ6K888TDWJ}4V{GOQ{ZXC.jpg',
  })
  originalFileName: string;

  @ApiProperty({
    description: '存储文件名',
    example: '1745936543414764509bb-25ec-442f-a128-285aaf2bad18',
  })
  storageFileName: string;

  @ApiProperty({
    description: '文件存储路径',
    example:
      '/home/xiaoxin/projects/agricultural-diagnostic-service/dist/uploads/1745936543414764509bb-25ec-442f-a128-285aaf2bad18',
  })
  filePath: string;

  @ApiProperty({
    description: '文件大小（字节）',
    example: '42667',
  })
  fileSize: string;

  @ApiProperty({
    description: '文件MIME类型',
    example: 'image/jpeg',
  })
  fileType: string;

  @ApiProperty({
    description: '文件MD5值',
    example: '5910dfc70994fc4b005c4ca19d92d05c',
  })
  fileMd5: string;

  @ApiProperty({
    description: '访问权限 (public: 公开, private: 私有)',
    example: 'private',
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

  @ApiProperty({
    description: '文件版本号',
    example: 1,
  })
  version: number;
}
