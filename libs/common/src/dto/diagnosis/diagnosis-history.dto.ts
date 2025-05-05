import { ApiProperty } from '@nestjs/swagger';

export class DiagnosisHistoryDto {
  @ApiProperty({
    description: '诊断历史ID',
    example: 3729,
  })
  id: number;

  @ApiProperty({
    description: '创建时间',
    example: '2025-05-05T15:26:31.723Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: '更新时间',
    example: '2025-05-05T15:26:31.723Z',
  })
  updatedAt: Date;

  @ApiProperty({
    description: '诊断图片ID',
    example: 4392,
  })
  fileId: number;

  @ApiProperty({
    description: '诊断结果',
    example: null,
    nullable: true,
  })
  diagnosisResult: string | null;

  @ApiProperty({
    description: '诊断状态',
    example: 'pending',
    enum: ['pending', 'success', 'failed', 'processing'],
  })
  status: string;

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
