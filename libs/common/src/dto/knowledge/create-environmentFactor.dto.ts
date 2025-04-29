import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class EnvironmentFactorDto {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({ description: '环境因素', required: true })
  factor: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({ description: '最佳范围', required: true })
  optimalRange: string;
}

export class CreateEnvironmentFactorDto extends EnvironmentFactorDto {
  @IsNotEmpty()
  @IsNumber()
  @ApiProperty({ description: '疾病ID', required: true })
  diseaseId: number;
}
