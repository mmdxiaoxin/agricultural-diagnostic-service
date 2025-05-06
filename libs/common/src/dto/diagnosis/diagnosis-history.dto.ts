import { ApiProperty } from '@nestjs/swagger';
import { BaseDto } from '../base.dto';

export class DiagnosisHistoryDto extends BaseDto {
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
