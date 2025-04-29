import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateEnvironmentFactorDto {
  @IsOptional()
  @IsNumber()
  @ApiProperty({ description: '疾病ID', required: true })
  diseaseId: number;

  @IsOptional()
  @IsString()
  @ApiProperty({ description: '环境因素', required: false })
  factor?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ description: '最佳范围', required: false })
  optimalRange?: string;
}
