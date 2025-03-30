import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreateEnvironmentFactorDto {
  @IsNotEmpty()
  @IsNumber()
  @ApiProperty({ description: '疾病ID' })
  diseaseId: number;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({ description: '环境因素' })
  factor: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({ description: '最佳范围' })
  optimalRange: string;
}
