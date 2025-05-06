import { ApiProperty } from '@nestjs/swagger';

export class DiagnosisStatisticsDto {
  @ApiProperty({
    description: '诊断历史统计',
    example: 10,
  })
  history: number;

  @ApiProperty({
    description: '反馈统计',
    example: 8,
  })
  feedback: number;
}
