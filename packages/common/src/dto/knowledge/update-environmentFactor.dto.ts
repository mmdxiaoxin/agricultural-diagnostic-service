import { IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateEnvironmentFactorDto {
  @IsOptional()
  @IsNumber()
  diseaseId?: number;

  @IsOptional()
  @IsString()
  factor?: string;

  @IsOptional()
  @IsString()
  optimalRange?: string;
}
