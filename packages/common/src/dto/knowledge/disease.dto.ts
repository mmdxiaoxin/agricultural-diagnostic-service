import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class DiseaseDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  alias?: string;

  @IsOptional()
  @IsString()
  cause?: string;

  @IsOptional()
  @IsString()
  transmission?: string;
}
