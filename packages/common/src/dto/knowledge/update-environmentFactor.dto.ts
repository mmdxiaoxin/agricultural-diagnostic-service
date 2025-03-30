import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateEnvironmentFactorDto {
  @IsOptional()
  @IsNumber()
  @ApiProperty({ description: '疾病ID' })
  diseaseId?: number;

  @IsOptional()
  @IsString()
  @ApiProperty({ description: '环境因素' })
  factor?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ description: '最佳范围' })
  optimalRange?: string;
}
