import { IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateDiseaseDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  alias?: string;

  @IsOptional()
  @IsNumber()
  cropId?: number;

  @IsOptional()
  @IsString()
  cause?: string;

  @IsOptional()
  @IsString()
  transmission?: string;
}
