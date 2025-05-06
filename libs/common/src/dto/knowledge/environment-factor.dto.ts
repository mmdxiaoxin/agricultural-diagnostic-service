import { ApiProperty } from '@nestjs/swagger';
import { BaseDto } from '../base.dto';

export class EnvironmentFactorDto extends BaseDto {
  @ApiProperty({ description: '环境因素', required: true })
  factor: string;

  @ApiProperty({ description: '最佳范围', required: true })
  optimalRange: string;
}
