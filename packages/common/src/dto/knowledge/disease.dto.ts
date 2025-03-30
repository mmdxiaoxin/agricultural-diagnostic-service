import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class DiseaseDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  alias?: string;

  @IsNotEmpty()
  @IsNumber()
  cropId: number;

  @IsOptional()
  @IsString()
  cause?: string;

  @IsOptional()
  @IsString()
  transmission?: string;
}
