import { ApiProperty } from '@nestjs/swagger';
import { BaseDto } from '../base.dto';

export class SymptomDto extends BaseDto {
  @ApiProperty({ description: '症状描述', required: true })
  description: string;

  @ApiProperty({ description: '图片URL', required: false })
  imageUrl?: string;

  @ApiProperty({ description: '生长阶段', required: false })
  stage?: string;
}
