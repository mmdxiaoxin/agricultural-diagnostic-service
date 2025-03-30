import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class EnvironmentFactorDto {
  @IsNotEmpty()
  @IsNumber()
  diseaseId: number;

  @IsNotEmpty()
  @IsString()
  factor: string;

  @IsNotEmpty()
  @IsString()
  optimalRange: string;
}
