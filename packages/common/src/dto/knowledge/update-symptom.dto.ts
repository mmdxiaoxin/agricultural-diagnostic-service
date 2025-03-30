import { IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateSymptomDto {
  @IsOptional()
  @IsNumber()
  diseaseId?: number;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  @IsString()
  stage?: string;
}
