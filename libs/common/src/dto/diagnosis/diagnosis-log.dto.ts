import { ApiProperty } from '@nestjs/swagger';

// 元数据
export class DiagnosisLogMetadataDto {
  @ApiProperty({
    description: '诊断结果',
    type: Object,
  })
  result: object;

  @ApiProperty({
    description: '状态',
    example: 'success',
  })
  status: string;
}

// 诊断日志
export class DiagnosisLogDto {
  @ApiProperty({
    description: '日志ID',
    example: 46085,
  })
  id: number;

  @ApiProperty({
    description: '诊断ID',
    example: 3728,
  })
  diagnosisId: number;

  @ApiProperty({
    description: '日志级别',
    example: 'info',
    enum: ['info', 'warn', 'error', 'debug'],
  })
  level: string;

  @ApiProperty({
    description: '日志消息',
    example: '诊断任务完成',
  })
  message: string;

  @ApiProperty({
    description: '元数据',
    type: DiagnosisLogMetadataDto,
  })
  metadata: DiagnosisLogMetadataDto;

  @ApiProperty({
    description: '创建时间',
    example: '2025-05-05T13:59:35.000Z',
  })
  createdAt: Date;
}
