import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class EnvironmentFactorDto {
  @IsNotEmpty()
  @IsString()
  factor: string;

  @IsNotEmpty()
  @IsString()
  optimalRange: string;
}
