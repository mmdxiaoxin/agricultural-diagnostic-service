import { ApiProperty } from '@nestjs/swagger';

export class UploadTaskDto {
  @ApiProperty({
    description: '任务ID',
    example: 'f01db716709035c33b8687764de802e4',
  })
  taskId: string;

  @ApiProperty({
    description: '用户ID',
    example: 16,
  })
  userId: number;

  @ApiProperty({
    description: '文件名',
    example: 'trojan-go-linux-amd64.zip',
  })
  fileName: string;

  @ApiProperty({
    description: '文件大小（字节）',
    example: 7918291,
  })
  fileSize: number;

  @ApiProperty({
    description: '文件类型',
    example: 'application/x-zip-compressed',
  })
  fileType: string;

  @ApiProperty({
    description: '文件MD5值',
    example: '034ca78ff92d5f7201e3fe13844efec2',
  })
  fileMd5: string;

  @ApiProperty({
    description: '总分片数',
    example: 8,
  })
  totalChunks: number;

  @ApiProperty({
    description: '已上传的分片列表',
    example: [],
    type: [Number],
  })
  uploadedChunks: number[];
}
