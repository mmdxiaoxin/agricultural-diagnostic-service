import { ApiProperty } from '@nestjs/swagger';
import { MatchResultDto } from './match-result.dto';
import { PredictionDto } from './prediction.dto';

// 诊断结果
export class DiagnosisResultDto {
  @ApiProperty({
    description: '状态',
    example: 'success',
  })
  status: string;

  @ApiProperty({
    description: '任务ID',
    example: 'c9a1d1fe-5027-4805-a8ec-4f785d7b1274',
  })
  task_id: string;

  @ApiProperty({
    description: '预测结果',
    type: [PredictionDto],
  })
  predictions: PredictionDto[];

  @ApiProperty({
    description: '匹配结果',
    type: [MatchResultDto],
  })
  matchResults: MatchResultDto[];
}
